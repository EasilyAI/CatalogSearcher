"""
Batch search endpoint handler.

Supports both synchronous and asynchronous (job-based) processing:
- Small batches (<=50 items): Synchronous processing with immediate results
- Large batches (>50 items): Async job pattern with polling

Job-based processing stores results incrementally in DynamoDB for resilience.

IMPORTANT: HTTP API Gateway has a 30-second hard timeout limit.
For large batches, we return immediately with a job ID and process asynchronously
using Lambda's async invocation pattern.
"""

import logging
import os
import json
import re
import boto3
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

from .utils import create_response, get_search_service
from .rerank_openai import rerank_results, batch_rerank_results
from .batch_job_service import get_batch_job_service, JobStatus, BatchJobService

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Configuration - OPTIMIZED FOR MAXIMUM PERFORMANCE
ASYNC_THRESHOLD = int(os.getenv('ASYNC_THRESHOLD', '20'))  # Use async for batches larger than this
CHUNK_SIZE = int(os.getenv('BATCH_CHUNK_SIZE', '20'))  # Save results every N items
BATCH_RERANK_SIZE = int(os.getenv('OPENAI_BATCH_RERANK_SIZE', '20'))  # Items per rerank call
MAX_SEARCH_WORKERS = int(os.getenv('MAX_SEARCH_WORKERS', '25'))  # Parallel Qdrant searches
SEARCH_RESULT_SIZE = int(os.getenv('SEARCH_RESULT_SIZE', '10'))  # Fewer candidates = faster reranking
PARALLEL_WORKER_CHUNKS = int(os.getenv('PARALLEL_WORKER_CHUNKS', '10'))  # 10 parallel Lambda workers for speed

# Lambda client for async invocation (lazy initialized)
_lambda_client = None

def _get_lambda_client():
    """Get or create Lambda client for async invocations."""
    global _lambda_client
    if _lambda_client is None:
        _lambda_client = boto3.client('lambda')
    return _lambda_client


def get_request_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract request body from API Gateway event.
    
    Args:
        event: API Gateway event
        
    Returns:
        Parsed request body as dict
    """
    body = event.get('body', '{}')
    
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}
    
    return body if isinstance(body, dict) else {}


def get_path_parameter(event: Dict[str, Any], param_name: str) -> Optional[str]:
    """
    Extract a path parameter from API Gateway event.
    
    Args:
        event: API Gateway event
        param_name: Name of the path parameter
        
    Returns:
        Parameter value or None
    """
    # Try pathParameters first (standard API Gateway)
    path_params = event.get('pathParameters', {}) or {}
    if param_name in path_params:
        return path_params[param_name]
    
    # Fallback: extract from rawPath
    raw_path = event.get('rawPath', '')
    # Match patterns like /batch-search/status/{jobId}
    patterns = [
        rf'/batch-search/status/([^/]+)',
        rf'/batch-search/results/([^/]+)',
        rf'/batch-search/retry/([^/]+)',
        rf'/batch-search/cancel/([^/]+)',
        rf'/batch-search/resume/([^/]+)',
        rf'/batch-search/jobs/([^/]+)/selections',  # For save selections endpoint
        rf'/batch-search/jobs/([^/]+)',  # For delete endpoint
    ]
    for pattern in patterns:
        match = re.search(pattern, raw_path)
        if match:
            return match.group(1)
    
    return None


def get_user_id(event: Dict[str, Any]) -> str:
    """
    Extract user ID from API Gateway event.
    
    Args:
        event: API Gateway event
        
    Returns:
        User ID (from Cognito claims or fallback to 'anonymous')
    """
    # Try to get from Cognito JWT claims
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    
    # HTTP API with JWT authorizer
    jwt_claims = authorizer.get('jwt', {}).get('claims', {})
    if jwt_claims:
        return jwt_claims.get('sub') or jwt_claims.get('cognito:username') or 'anonymous'
    
    # Lambda authorizer context
    if 'claims' in authorizer:
        return authorizer['claims'].get('sub') or 'anonymous'
    
    # Fallback
    return 'anonymous'


def handle_batch_search(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle /batch-search POST requests.
    
    For large batches (>50 items), creates an async job and returns immediately.
    For small batches, processes synchronously.
    
    Request body:
    - items (required): Array of items to search, each with:
      - orderingNumber (optional): Ordering number/SKU to search by
      - description (required if no orderingNumber): Description to search by
      - quantity (required): Quantity needed
      - productCategory (required): Product category
    - size (optional): Number of results to retrieve before optional re-ranking (default 30, max 100)
    - min_score (optional): Minimum similarity score (0-1)
    - use_ai (optional): Whether to enable LLM-based re-ranking (default: true, only for description searches)
    - result_size (optional): Number of results to return after re-ranking (default: 5)
    - async (optional): Force async processing even for small batches (default: auto)
    - fileName (optional): Original file name for job tracking
    
    Args:
        event: API Gateway event
        
    Returns:
        API Gateway response with batch search results or job info
    """
    try:
        body = get_request_body(event)
        items = body.get('items', [])
        
        if not items or not isinstance(items, list):
            return create_response(400, {
                'error': 'Missing or invalid items array'
            })
        
        # Extract optional parameters
        size = int(body.get('size', 30))
        size = min(max(size, 1), 100)  # Clamp between 1-100
        
        min_score = float(body.get('min_score', 0.0))
        min_score = max(0.0, min(1.0, min_score))  # Clamp between 0-1
        
        # Optional AI re-ranking controls
        use_ai_param = body.get('use_ai')
        should_use_ai = True
        if use_ai_param is not None:
            should_use_ai = str(use_ai_param).strip().lower() not in {'false', '0', 'no'}
        
        result_size_param = body.get('result_size')
        num_results_to_return = 5
        if result_size_param is not None:
            try:
                num_results_to_return = int(result_size_param)
            except ValueError:
                raise ValueError("result_size must be an integer")
        
        # Clamp number of results to return
        num_results_to_return = max(1, min(num_results_to_return, size))
        
        # Check if async processing is requested or required
        force_async = body.get('async', False)
        use_async = force_async or len(items) > ASYNC_THRESHOLD
        
        file_name = body.get('fileName', '')
        user_id = get_user_id(event)
        
        logger.info(
            "Batch search parameters: items = %d, size = %s, "
            "min_score = %s, use_ai = %s, result_size = %s, async = %s",
            len(items),
            size,
            min_score,
            should_use_ai,
            num_results_to_return,
            use_async,
        )
        
        search_params = {
            'size': size,
            'min_score': min_score,
            'use_ai': should_use_ai,
            'result_size': num_results_to_return
        }
        
        if use_async:
            # Create async job and process in background
            return _handle_async_batch_search(
                user_id=user_id,
                items=items,
                search_params=search_params,
                file_name=file_name
            )
        else:
            # Process synchronously for small batches
            return _handle_sync_batch_search(
                items=items,
                search_params=search_params
            )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {
            'error': 'Invalid parameter',
            'message': 'Failed to process batch search'
        })
    except Exception as e:
        logger.error(f"Batch search error: {str(e)}", exc_info=True)
        return create_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to process batch search'
        })


def _handle_sync_batch_search(
    items: List[Dict[str, Any]],
    search_params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Handle synchronous batch search for small batches.
    """
    service = get_search_service()
    results = _execute_batch_searches(
        service=service,
        items=items,
        size=search_params['size'],
        min_score=search_params['min_score'],
        should_use_ai=search_params['use_ai'],
        num_results_to_return=search_params['result_size']
    )
    
    # Calculate summary statistics
    total_items = len(items)
    items_with_matches = sum(1 for r in results if r.get('matches') and len(r['matches']) > 0)
    items_without_matches = total_items - items_with_matches
    
    # Format response
    response_body = {
        'results': results,
        'summary': {
            'total': total_items,
            'found': items_with_matches,
            'notFound': items_without_matches
        }
    }
    
    return create_response(200, response_body)
def _handle_async_batch_search(
    user_id: str,
    items: List[Dict[str, Any]],
    search_params: Dict[str, Any],
    file_name: str
) -> Dict[str, Any]:
    """
    Handle asynchronous batch search for large batches.
    
    Creates a job in DynamoDB and invokes PARALLEL worker Lambdas
    to process chunks of items simultaneously. This significantly
    reduces total processing time.
    
    Architecture:
    - Split items into N chunks (PARALLEL_WORKER_CHUNKS)
    - Invoke N worker Lambdas in parallel
    - Workers process their chunks and return results
    - Main Lambda aggregates results and saves to DynamoDB
    """
    job_service = get_batch_job_service()
    
    # Create job record in DynamoDB
    job = job_service.create_job(
        user_id=user_id,
        total_items=len(items),
        file_name=file_name,
        search_params=search_params,
        items=items  # Store for retry capability
    )
    
    job_id = job['jobId']
    logger.info(f"Created async batch search job {job_id} with {len(items)} items")
    
    # Trigger async processing via coordinator Lambda
    try:
        lambda_client = _get_lambda_client()
        function_name = os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'product-search-service-dev-searchApi')
        
        # Create an internal event to trigger PARALLEL job processing
        async_event = {
            'httpMethod': 'POST',
            'path': '/internal/process-batch-job',
            'body': json.dumps({
                'jobId': job_id,
                'action': 'process_batch_job',
                'useParallelWorkers': True  # Enable parallel workers
            }),
            'headers': {},
            'isBase64Encoded': False,
            '_internal': True  # Flag to skip auth for internal calls
        }
        
        # Invoke Lambda asynchronously (Event invocation type)
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='Event',  # Async - returns immediately
            Payload=json.dumps(async_event)
        )
        
        logger.info(f"Triggered async PARALLEL processing for job {job_id}")
        
    except Exception as e:
        logger.error(f"Failed to trigger async processing for job {job_id}: {str(e)}", exc_info=True)
        # Fall back to sequential processing
        logger.warning(f"Falling back to sequential processing for job {job_id}")
        try:
            _process_batch_job(
                job_id=job_id,
                items=items,
                search_params=search_params,
                job_service=job_service
            )
        except Exception as proc_error:
            logger.error(f"Sequential processing also failed: {str(proc_error)}")
            job_service.update_job_status(job_id, JobStatus.FAILED, str(proc_error))
    
    # Return immediately with job ID - client will poll for status
    return create_response(202, {
        'jobId': job_id,
        'status': JobStatus.PROCESSING,
        'message': 'Job created and parallel processing started',
        'progress': {
            'processed': 0,
            'total': len(items)
        },
        'async': True
    })


# Minimum remaining time (ms) before we stop processing and save state
TIMEOUT_BUFFER_MS = 30000  # 30 seconds buffer before Lambda timeout


def _process_batch_job(
    job_id: str,
    items: List[Dict[str, Any]],
    search_params: Dict[str, Any],
    job_service: BatchJobService,
    start_from_index: int = 0,  # For resuming from a specific point
    lambda_context: Any = None  # Lambda context for timeout detection
) -> bool:
    """
    Process a batch search job with incremental saves.
    
    Saves results to DynamoDB every CHUNK_SIZE items for resilience.
    Uses batch reranking to reduce OpenAI API calls.
    Supports resumption from a specific index for interrupted jobs.
    
    Uses Lambda context to detect approaching timeout and gracefully save state.
    
    Args:
        job_id: Job ID
        items: List of items to process
        search_params: Search parameters
        job_service: BatchJobService instance
        start_from_index: Index to start processing from (for resumption)
        lambda_context: Lambda context for timeout detection (optional)
        
    Returns:
        True if job completed fully, False if stopped early due to timeout
    """
    job_service.update_job_status(job_id, JobStatus.PROCESSING)
    
    service = get_search_service()
    # Use optimized search size - fewer candidates = faster reranking
    size = min(search_params.get('size', 30), SEARCH_RESULT_SIZE)
    min_score = search_params.get('min_score', 0.0)
    should_use_ai = search_params.get('use_ai', True)
    num_results_to_return = search_params.get('result_size', 5)
    
    # Get current progress from job (for resumption)
    current_job = job_service.get_job(job_id)
    if current_job and start_from_index == 0:
        # Check if we should resume from where we left off
        processed_items = current_job.get('processedItems', 0)
        if processed_items > 0:
            start_from_index = processed_items
            logger.info(f"Resuming job {job_id} from item {start_from_index}")
    
    successful_count = current_job.get('successfulItems', 0) if current_job else 0
    failed_count = current_job.get('failedItems', 0) if current_job else 0
    processed_count = start_from_index
    
    # Process items in chunks, starting from resume point
    items_to_process = items[start_from_index:]
    
    for chunk_offset in range(0, len(items_to_process), CHUNK_SIZE):
        # Check if we're running out of time before starting a new chunk
        if lambda_context:
            remaining_time_ms = lambda_context.get_remaining_time_in_millis()
            if remaining_time_ms < TIMEOUT_BUFFER_MS:
                logger.warning(
                    f"Job {job_id}: Only {remaining_time_ms}ms remaining, "
                    f"stopping at {processed_count}/{len(items)} items to save state"
                )
                # Mark job as partial so it can be resumed
                job_service.update_job_status(
                    job_id, 
                    JobStatus.PARTIAL, 
                    f"Timeout reached at {processed_count}/{len(items)} items"
                )
                return False  # Indicate job didn't complete
        
        chunk_items = items_to_process[chunk_offset:chunk_offset + CHUNK_SIZE]
        actual_start_index = start_from_index + chunk_offset
        
        logger.info(f"Processing job {job_id} items {actual_start_index}-{actual_start_index + len(chunk_items)} of {len(items)}")
        
        # Execute searches for this chunk
        chunk_results = _execute_batch_searches_with_batch_rerank(
            service=service,
            items=chunk_items,
            start_index=actual_start_index,
            size=size,
            min_score=min_score,
            should_use_ai=should_use_ai,
            num_results_to_return=num_results_to_return,
            job_id=job_id,
            job_service=job_service
        )
        
        # Track success/failure
        for result in chunk_results:
            if result.get('error'):
                failed_count += 1
            elif result.get('matches') and len(result['matches']) > 0:
                successful_count += 1
        
        processed_count += len(chunk_results)
        
        # Save chunk to DynamoDB
        job_service.append_results_chunk(
            job_id=job_id,
            results=chunk_results,
            processed_count=processed_count,
            successful_count=successful_count,
            failed_count=failed_count
        )
        
        logger.info(f"Job {job_id} progress: {processed_count}/{len(items)} items processed")
    
    # Complete the job
    total_items = len(items)
    items_without_matches = total_items - successful_count - failed_count
    
    summary = {
        'total': total_items,
        'found': successful_count,
        'notFound': items_without_matches,
        'failed': failed_count
    }
    
    job_service.complete_job(job_id, summary)
    logger.info(f"Completed job {job_id}: {summary}")
    return True  # Job completed fully


def _process_batch_job_parallel(
    job_id: str,
    items: List[Dict[str, Any]],
    search_params: Dict[str, Any],
    job_service: BatchJobService,
    start_from_index: int = 0,
    lambda_context: Any = None
) -> bool:
    """
    Process a batch job using PARALLEL worker Lambda invocations.
    
    This splits the remaining items into N chunks and invokes N worker
    Lambdas simultaneously, drastically reducing total processing time.
    
    For 200 items with 4 workers: ~50 items per worker = parallel processing
    Instead of 200 items sequentially = MUCH faster
    
    Args:
        job_id: Job ID
        items: All items in the job
        search_params: Search parameters
        job_service: BatchJobService instance
        start_from_index: Index to start processing from (for resumption)
        lambda_context: Lambda context for timeout detection
        
    Returns:
        True if job completed fully, False if stopped early
    """
    job_service.update_job_status(job_id, JobStatus.PROCESSING)
    
    # Get items to process (after resume point)
    items_to_process = items[start_from_index:]
    total_remaining = len(items_to_process)
    
    if total_remaining == 0:
        logger.info(f"Job {job_id}: No items remaining to process")
        job_service.complete_job(job_id, {'total': len(items), 'found': 0, 'notFound': 0, 'failed': 0})
        return True
    
    # Calculate chunk sizes for parallel workers
    # For 226 items with 10 workers = ~23 items each, processed in parallel
    # Minimum 5 items per worker to avoid overhead
    num_workers = min(PARALLEL_WORKER_CHUNKS, max(1, total_remaining // 5))
    chunk_size = (total_remaining + num_workers - 1) // num_workers  # Ceiling division
    
    logger.info(f"Job {job_id}: Processing {total_remaining} items with {num_workers} parallel workers (~{chunk_size} each)")
    
    # Split items into chunks for each worker
    worker_chunks = []
    for i in range(num_workers):
        chunk_start = i * chunk_size
        chunk_end = min(chunk_start + chunk_size, total_remaining)
        if chunk_start < total_remaining:
            worker_chunks.append({
                'items': items_to_process[chunk_start:chunk_end],
                'startIndex': start_from_index + chunk_start,
                'workerId': i
            })
    
    # Invoke worker Lambdas in parallel using ThreadPoolExecutor
    lambda_client = _get_lambda_client()
    worker_function = os.environ.get('BATCH_WORKER_FUNCTION', 'product-search-service-dev-batchWorker')
    
    all_results = []
    total_successful = 0
    total_failed = 0
    
    def invoke_worker(chunk_data: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke a single worker Lambda and wait for results."""
        worker_id = chunk_data['workerId']
        payload = {
            'items': chunk_data['items'],
            'startIndex': chunk_data['startIndex'],
            'searchParams': search_params,
            'jobId': job_id,
            'workerId': worker_id
        }
        
        try:
            logger.info(f"Job {job_id}: Invoking worker {worker_id} for {len(chunk_data['items'])} items")
            
            response = lambda_client.invoke(
                FunctionName=worker_function,
                InvocationType='RequestResponse',  # Synchronous - wait for result
                Payload=json.dumps(payload)
            )
            
            # Parse response
            response_payload = json.loads(response['Payload'].read().decode('utf-8'))
            
            if 'error' in response_payload:
                logger.error(f"Worker {worker_id} error: {response_payload['error']}")
                return {
                    'workerId': worker_id,
                    'results': [],
                    'processedCount': 0,
                    'successfulCount': 0,
                    'failedCount': len(chunk_data['items']),
                    'error': response_payload['error']
                }
            
            logger.info(f"Worker {worker_id} completed: {response_payload.get('processedCount', 0)} items")
            return response_payload
            
        except Exception as e:
            logger.error(f"Failed to invoke worker {worker_id}: {str(e)}", exc_info=True)
            return {
                'workerId': worker_id,
                'results': [],
                'processedCount': 0,
                'successfulCount': 0,
                'failedCount': len(chunk_data['items']),
                'error': str(e)
            }
    
    # Execute all worker invocations in parallel
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(invoke_worker, chunk): chunk for chunk in worker_chunks}
        
        completed_chunks = 0
        for future in as_completed(futures):
            try:
                result = future.result()
                worker_id = result.get('workerId', -1)
                
                # Collect results
                worker_results = result.get('results', [])
                all_results.extend(worker_results)
                total_successful += result.get('successfulCount', 0)
                total_failed += result.get('failedCount', 0)
                
                completed_chunks += 1
                processed_count = start_from_index + len(all_results)
                
                # Update progress in DynamoDB after each worker completes
                job_service.update_job_progress(
                    job_id=job_id,
                    processed_count=processed_count,
                    successful_count=total_successful,
                    failed_count=total_failed
                )
                
                # Save results chunk
                if worker_results:
                    job_service.append_results_chunk(
                        job_id=job_id,
                        results=worker_results,
                        processed_count=processed_count,
                        successful_count=total_successful,
                        failed_count=total_failed
                    )
                
                logger.info(f"Job {job_id}: Worker {worker_id} done. Progress: {processed_count}/{len(items)} ({completed_chunks}/{num_workers} workers)")
                
                # Check for timeout before processing more results
                if lambda_context and lambda_context.get_remaining_time_in_millis() < TIMEOUT_BUFFER_MS:
                    logger.warning(f"Job {job_id}: Timeout approaching, marking as partial")
                    job_service.update_job_status(
                        job_id, 
                        JobStatus.PARTIAL,
                        f"Timeout at {processed_count}/{len(items)} items"
                    )
                    return False
                    
            except Exception as e:
                logger.error(f"Error processing worker future: {str(e)}", exc_info=True)
    
    # All workers completed - finalize job
    total_items = len(items)
    items_without_matches = total_items - total_successful - total_failed
    
    summary = {
        'total': total_items,
        'found': total_successful,
        'notFound': items_without_matches,
        'failed': total_failed
    }
    
    job_service.complete_job(job_id, summary)
    logger.info(f"Job {job_id} completed via parallel workers: {summary}")
    return True


def _execute_batch_searches(
    service,
    items: List[Dict[str, Any]],
    size: int,
    min_score: float,
    should_use_ai: bool,
    num_results_to_return: int
) -> List[Dict[str, Any]]:
    """
    Execute batch searches in parallel.
    
    Args:
        service: SearchService instance
        items: List of items to search
        size: Number of results to retrieve
        min_score: Minimum similarity score
        should_use_ai: Whether to use AI re-ranking
        num_results_to_return: Number of results to return after re-ranking
        
    Returns:
        List of search results, one per item
    """
    results = []
    
    def search_item(item: Dict[str, Any], index: int) -> Dict[str, Any]:
        """
        Search a single item.
        
        This function is not redundant with search.py's handle_search - it serves a different purpose:
        - It's a wrapper for batch processing that handles search hierarchy (ordering number vs description)
        - It formats results specifically for batch response structure
        - It handles per-item error handling without failing the entire batch
        - It's designed to run in parallel via ThreadPoolExecutor
        
        The underlying search service (SearchService.vector_search) is reused from search.py.
        """
        ordering_number = item.get('orderingNumber', '').strip() if item.get('orderingNumber') else None
        description = item.get('description', '').strip() if item.get('description') else None
        category = item.get('productCategory') or item.get('productType')
        quantity = item.get('quantity', 1)
        
        # Validate item has at least one search term
        if not ordering_number and not description:
            logger.warning(f"Item {index} has neither orderingNumber nor description, skipping")
            return {
                'itemIndex': index,
                'query': ordering_number or description or 'N/A',
                'category': category,
                'quantity': quantity,
                'matches': [],
                'error': 'Item must have either orderingNumber or description'
            }
        
        try:
            # Search hierarchy: if ordering number exists, search by ordering number
            # Otherwise, search by description
            if ordering_number:
                # Search by ordering number (exact/prefix match via text_query)
                logger.info(
                    "Searching item %d by ordering number: '%s' (category: %s)",
                    index,
                    ordering_number,
                    category
                )
                search_results = service.vector_search(
                    query=ordering_number,
                    limit=size,
                    category=category,
                    min_score=min_score,
                    text_query=ordering_number  # Force text search for ordering number (supports prefix matching via PREFIX tokenizer)
                )
                
                # If no results and query is short (likely a prefix), also try autocomplete-style search
                if len(search_results) == 0 and len(ordering_number) >= 2:
                    logger.info(
                        "No results from vector search, trying autocomplete-style prefix search for '%s'",
                        ordering_number
                    )
                    autocomplete_results = service.autocomplete(
                        prefix=ordering_number,
                        limit=size,
                        category=category
                    )
                    # Convert autocomplete results to match vector_search format
                    if autocomplete_results:
                        search_results = [{
                            'orderingNumber': item.get('orderingNumber', ''),
                            'category': item.get('category', category or ''),
                            'score': 0.9,  # High score for prefix matches
                            'relevance': 'high',
                            'searchText': item.get('searchText', '')
                        } for item in autocomplete_results]
                
                # Boost exact matches for orderingNumber searches
                # This ensures exact matches appear first, even if they have lower vector similarity scores
                if search_results:
                    logger.info(
                        "Boosting exact matches for orderingNumber search '%s' (found %d results)",
                        ordering_number,
                        len(search_results)
                    )
                    search_results = service.boost_exact_matches(
                        results=search_results,
                        search_query=ordering_number,
                        is_ordering_number_search=True
                    )
                
                # Return top results after boosting
                search_results = search_results[:num_results_to_return]
            else:
                # Search by description (vector search)
                logger.info(
                    "Searching item %d by description: '%s' (category: %s)",
                    index,
                    description,
                    category
                )
                search_results = service.vector_search(
                    query=description,
                    limit=size,
                    category=category,
                    min_score=min_score
                )
                
                # Apply re-ranking only for description-based searches
                if should_use_ai and len(search_results) > 5:
                    logger.info(
                        "Invoking OpenAI re-ranking for item %d with %d candidates (top %d)",
                        index,
                        len(search_results),
                        num_results_to_return,
                    )
                    search_results = rerank_results(
                        query=description,
                        results=search_results,
                        top_k=num_results_to_return
                    )
                else:
                    # If we are not re-ranking, still respect the requested number of results to return
                    search_results = search_results[:num_results_to_return]
            
            # Format matches to match frontend expectations
            formatted_matches = []
            for match in search_results:
                formatted_matches.append({
                    'id': f'M{index}-{len(formatted_matches) + 1}',
                    'productName': match.get('searchText', ''),
                    'orderingNo': match.get('orderingNumber', ''),
                    'confidence': int(match.get('score', 0) * 100) if match.get('score') else 0,
                    'type': match.get('category', category or ''),
                    'specifications': match.get('searchText', ''),
                    'score': match.get('score', 0),
                    'relevance': match.get('relevance', 'low')
                })
            
            return {
                'itemIndex': index,
                'query': ordering_number or description,
                'category': category,
                'quantity': quantity,
                'matches': formatted_matches
            }
            
        except Exception as e:
            logger.error(f"Error searching item {index}: {str(e)}", exc_info=True)
            return {
                'itemIndex': index,
                'query': ordering_number or description or 'N/A',
                'category': category,
                'quantity': quantity,
                'matches': [],
                'error': str(e)
            }
    
    # Execute searches in parallel using ThreadPoolExecutor
    # Using threads since the search service uses synchronous Qdrant client
    max_workers = min(len(items), 10)  # Limit concurrent searches to avoid overwhelming the system
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all search tasks
        future_to_item = {
            executor.submit(search_item, item, idx): (item, idx)
            for idx, item in enumerate(items)
        }
        
        # Collect results as they complete
        item_results = {}
        for future in as_completed(future_to_item):
            try:
                result = future.result()
                item_results[result['itemIndex']] = result
            except Exception as e:
                item, idx = future_to_item[future]
                logger.error(f"Failed to get result for item {idx}: {str(e)}")
                item_results[idx] = {
                    'itemIndex': idx,
                    'query': item.get('orderingNumber') or item.get('description') or 'N/A',
                    'category': item.get('productCategory') or item.get('productType'),
                    'quantity': item.get('quantity', 1),
                    'matches': [],
                    'error': str(e)
                }
    
    # Return results in original order
    return [item_results[i] for i in range(len(items))]


def _execute_batch_searches_with_batch_rerank(
    service,
    items: List[Dict[str, Any]],
    start_index: int,
    size: int,
    min_score: float,
    should_use_ai: bool,
    num_results_to_return: int,
    job_id: str,
    job_service: BatchJobService
) -> List[Dict[str, Any]]:
    """
    Execute batch searches with batch reranking to reduce OpenAI API calls.
    
    Instead of calling rerank for each item individually, this function:
    1. Executes vector searches for all items in parallel
    2. Collects description-based items that need reranking
    3. Batches rerank calls (BATCH_RERANK_SIZE items per call)
    
    Args:
        service: SearchService instance
        items: List of items to search (chunk)
        start_index: Starting index for this chunk in the full batch
        size: Number of results to retrieve
        min_score: Minimum similarity score
        should_use_ai: Whether to use AI re-ranking
        num_results_to_return: Number of results to return after re-ranking
        job_id: Job ID for error tracking
        job_service: BatchJobService instance
        
    Returns:
        List of search results, one per item
    """
    # Phase 1: Execute all vector searches in parallel (without reranking)
    initial_results = []
    items_needing_rerank = []  # [(index, description, search_results), ...]
    
    def search_item_no_rerank(item: Dict[str, Any], index: int) -> Tuple[int, Dict[str, Any], Optional[str], List[Dict[str, Any]]]:
        """
        Search a single item without reranking.
        Returns: (index, result_dict, description_if_needs_rerank, raw_search_results)
        """
        ordering_number = item.get('orderingNumber', '').strip() if item.get('orderingNumber') else None
        description = item.get('description', '').strip() if item.get('description') else None
        category = item.get('productCategory') or item.get('productType')
        quantity = item.get('quantity', 1)
        
        # Validate item has at least one search term
        if not ordering_number and not description:
            return (index, {
                'itemIndex': start_index + index,
                'query': 'N/A',
                'category': category,
                'quantity': quantity,
                'matches': [],
                'error': 'Item must have either orderingNumber or description'
            }, None, [])
        
        try:
            if ordering_number:
                # Search by ordering number - no reranking needed
                search_results = service.vector_search(
                    query=ordering_number,
                    limit=size,
                    category=category,
                    min_score=min_score,
                    text_query=ordering_number
                )
                
                if len(search_results) == 0 and len(ordering_number) >= 2:
                    autocomplete_results = service.autocomplete(
                        prefix=ordering_number,
                        limit=size,
                        category=category
                    )
                    if autocomplete_results:
                        search_results = [{
                            'orderingNumber': r.get('orderingNumber', ''),
                            'category': r.get('category', category or ''),
                            'score': 0.9,
                            'relevance': 'high',
                            'searchText': r.get('searchText', '')
                        } for r in autocomplete_results]
                
                if search_results:
                    search_results = service.boost_exact_matches(
                        results=search_results,
                        search_query=ordering_number,
                        is_ordering_number_search=True
                    )
                
                search_results = search_results[:num_results_to_return]
                
                # Format and return - no reranking needed for ordering number searches
                formatted_matches = _format_matches(search_results, start_index + index, category)
                return (index, {
                    'itemIndex': start_index + index,
                    'query': ordering_number,
                    'category': category,
                    'quantity': quantity,
                    'matches': formatted_matches
                }, None, [])
            else:
                # Search by description - may need reranking
                search_results = service.vector_search(
                    query=description,
                    limit=size,
                    category=category,
                    min_score=min_score
                )
                
                # Return with raw results for potential batch reranking
                return (index, {
                    'itemIndex': start_index + index,
                    'query': description,
                    'category': category,
                    'quantity': quantity,
                    'matches': []  # Will be filled after reranking
                }, description, search_results)
                
        except Exception as e:
            logger.error(f"Error searching item {start_index + index}: {str(e)}", exc_info=True)
            job_service.add_failed_item(job_id, start_index + index, str(e), retryable=True)
            return (index, {
                'itemIndex': start_index + index,
                'query': ordering_number or description or 'N/A',
                'category': category,
                'quantity': quantity,
                'matches': [],
                'error': str(e)
            }, None, [])
    
    # Execute searches in parallel with higher concurrency for Qdrant
    max_workers = min(len(items), MAX_SEARCH_WORKERS)
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_item = {
            executor.submit(search_item_no_rerank, item, idx): idx
            for idx, item in enumerate(items)
        }
        
        for future in as_completed(future_to_item):
            try:
                index, result, description, search_results = future.result()
                initial_results.append((index, result, description, search_results))
            except Exception as e:
                idx = future_to_item[future]
                logger.error(f"Failed to get result for item {start_index + idx}: {str(e)}")
                initial_results.append((idx, {
                    'itemIndex': start_index + idx,
                    'query': 'N/A',
                    'category': None,
                    'quantity': 1,
                    'matches': [],
                    'error': str(e)
                }, None, []))
    
    # Sort by original index
    initial_results.sort(key=lambda x: x[0])
    
    # Phase 2: Collect items needing reranking
    for index, result, description, search_results in initial_results:
        if description and should_use_ai and len(search_results) > 5:
            items_needing_rerank.append((index, description, search_results, result))
    
    # Phase 3: Batch rerank
    if items_needing_rerank:
        logger.info(f"Batch reranking {len(items_needing_rerank)} items in batches of {BATCH_RERANK_SIZE}")
        
        # Process in batches
        for batch_start in range(0, len(items_needing_rerank), BATCH_RERANK_SIZE):
            batch_end = min(batch_start + BATCH_RERANK_SIZE, len(items_needing_rerank))
            batch = items_needing_rerank[batch_start:batch_end]
            
            # Prepare batch rerank input
            queries_with_results = [
                {
                    'query': desc,
                    'results': results,
                    'itemIndex': idx
                }
                for idx, desc, results, _ in batch
            ]
            
            try:
                # Call batch rerank
                reranked_batch = batch_rerank_results(
                    queries_with_results=queries_with_results,
                    top_k=num_results_to_return
                )
                
                # Update results with reranked matches
                for reranked_item in reranked_batch:
                    item_index = reranked_item['itemIndex']
                    reranked_results = reranked_item['results']
                    
                    # Find the original result and update it
                    for i, (idx, result, desc, _) in enumerate(initial_results):
                        if start_index + idx == item_index:
                            category = result.get('category')
                            formatted_matches = _format_matches(reranked_results, item_index, category)
                            result['matches'] = formatted_matches
                            break
                            
            except Exception as e:
                logger.error(f"Batch rerank failed: {str(e)}", exc_info=True)
                # Fall back to using original results without reranking
                for idx, desc, results, result in batch:
                    category = result.get('category')
                    formatted_matches = _format_matches(results[:num_results_to_return], start_index + idx, category)
                    result['matches'] = formatted_matches
    
    # Phase 4: Handle items that didn't need reranking but have description searches
    for index, result, description, search_results in initial_results:
        if description and result.get('matches') == []:
            # Either reranking was skipped (<=5 results) or not using AI
            category = result.get('category')
            formatted_matches = _format_matches(search_results[:num_results_to_return], start_index + index, category)
            result['matches'] = formatted_matches
    
    return [result for _, result, _, _ in initial_results]


def _format_matches(
    search_results: List[Dict[str, Any]],
    item_index: int,
    category: Optional[str]
) -> List[Dict[str, Any]]:
    """Format search results as matches for frontend."""
    formatted_matches = []
    for match in search_results:
        formatted_matches.append({
            'id': f'M{item_index}-{len(formatted_matches) + 1}',
            'productName': match.get('searchText', ''),
            'orderingNo': match.get('orderingNumber', ''),
            'confidence': int(match.get('score', 0) * 100) if match.get('score') else 0,
            'type': match.get('category', category or ''),
            'specifications': match.get('searchText', ''),
            'score': match.get('score', 0),
            'relevance': match.get('relevance', 'low')
        })
    return formatted_matches


# ============================================================================
# Job Management Endpoints
# ============================================================================

def handle_batch_search_jobs(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle GET /batch-search/jobs requests.
    
    Returns list of recent jobs for the authenticated user.
    """
    try:
        user_id = get_user_id(event)
        
        # Get query parameters for limit
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', '10'))
        limit = max(1, min(50, limit))  # Clamp between 1-50
        
        job_service = get_batch_job_service()
        jobs = job_service.get_jobs_by_user(user_id, limit=limit)
        
        return create_response(200, {
            'jobs': jobs,
            'count': len(jobs)
        })
        
    except Exception as e:
        logger.error(f"Error listing jobs: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_status(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle GET /batch-search/status/{jobId} requests.
    
    Returns lightweight job status without full results.
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        status = job_service.get_job_status(job_id)
        
        if not status:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        return create_response(200, {
            'jobId': job_id,
            'status': status.get('status'),
            'progress': {
                'processed': status.get('processedItems', 0),
                'total': status.get('totalItems', 0),
                'successful': status.get('successfulItems', 0),
                'failed': status.get('failedItems', 0)
            },
            'createdAt': status.get('createdAt'),
            'updatedAt': status.get('updatedAt')
        })
        
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_results(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle GET /batch-search/results/{jobId} requests.
    
    Returns full job results.
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        job = job_service.get_job(job_id)
        
        if not job:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        return create_response(200, {
            'jobId': job_id,
            'status': job.get('status'),
            'results': job.get('results', []),
            'summary': job.get('summary'),
            'errors': job.get('errors', []),
            'failedItemIndices': job.get('failedItemIndices', []),
            'userSelections': job.get('userSelections', {}),
            'fileName': job.get('fileName', ''),
            'createdAt': job.get('createdAt'),
            'updatedAt': job.get('updatedAt')
        })
        
    except Exception as e:
        logger.error(f"Error getting job results: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_retry(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST /batch-search/retry/{jobId} requests.
    
    Retries only the failed items from a previous job.
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        
        # Get failed items
        failed_items = job_service.get_failed_items_for_retry(job_id)
        
        if failed_items is None:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        if not failed_items:
            return create_response(200, {
                'message': 'No failed items to retry',
                'jobId': job_id
            })
        
        # Get original job for search params
        original_job = job_service.get_job(job_id)
        search_params = original_job.get('searchParams', {})
        user_id = original_job.get('userId', 'anonymous')
        
        # Extract just the items (without originalIndex wrapper)
        items_to_retry = [fi['item'] for fi in failed_items]
        
        # Create a new job for retry
        new_job = job_service.create_job(
            user_id=user_id,
            total_items=len(items_to_retry),
            file_name=f"retry-{job_id}",
            search_params=search_params,
            items=items_to_retry
        )
        
        new_job_id = new_job['jobId']
        logger.info(f"Created retry job {new_job_id} with {len(items_to_retry)} items from job {job_id}")
        
        # Process the retry job synchronously (retries are typically small batches)
        try:
            _process_batch_job(
                job_id=new_job_id,
                items=items_to_retry,
                search_params=search_params,
                job_service=job_service
            )
        except Exception as e:
            logger.error(f"Error processing retry job {new_job_id}: {str(e)}", exc_info=True)
            job_service.update_job_status(new_job_id, JobStatus.FAILED, str(e))
        
        # Get final state
        final_job = job_service.get_job(new_job_id)
        
        return create_response(200, {
            'jobId': new_job_id,
            'originalJobId': job_id,
            'status': final_job.get('status') if final_job else 'unknown',
            'results': final_job.get('results', []) if final_job else [],
            'summary': final_job.get('summary') if final_job else None,
            'retriedItems': len(items_to_retry)
        })
        
    except Exception as e:
        logger.error(f"Error retrying job: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_cancel(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST /batch-search/cancel/{jobId} requests.
    
    Cancels a job (if still processing).
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        
        # Get current job state
        job = job_service.get_job_status(job_id)
        if not job:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        current_status = job.get('status')
        
        # Only cancel if still processing
        if current_status in [JobStatus.PENDING, JobStatus.PROCESSING]:
            job_service.cancel_job(job_id)
            return create_response(200, {
                'jobId': job_id,
                'status': JobStatus.CANCELLED,
                'message': 'Job cancelled'
            })
        else:
            return create_response(400, {
                'error': 'Cannot cancel job',
                'jobId': job_id,
                'status': current_status,
                'message': f'Job is already {current_status}'
            })
        
    except Exception as e:
        logger.error(f"Error cancelling job: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_delete(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle DELETE /batch-search/jobs/{jobId} requests.
    
    Deletes a job from the database. Only allows deletion of completed, 
    failed, cancelled, or partial jobs (not actively processing ones).
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        
        # Get current job state
        job = job_service.get_job_status(job_id)
        if not job:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        current_status = job.get('status')
        
        # Don't allow deletion of actively processing jobs
        if current_status in [JobStatus.PENDING, JobStatus.PROCESSING]:
            return create_response(400, {
                'error': 'Cannot delete active job',
                'jobId': job_id,
                'status': current_status,
                'message': 'Please cancel the job first before deleting'
            })
        
        # Delete the job
        success = job_service.delete_job(job_id)
        if success:
            return create_response(200, {
                'jobId': job_id,
                'message': 'Job deleted successfully'
            })
        else:
            return create_response(500, {
                'error': 'Failed to delete job',
                'jobId': job_id
            })
        
    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_save_selections(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle PUT /batch-search/jobs/{jobId}/selections requests.
    
    Saves user's match selections to the job for later retrieval.
    This allows users to come back and continue reviewing their selections.
    
    Request body:
    {
        "selections": {
            "<itemIndex>": "<selectedMatchId>",
            ...
        }
    }
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        body = get_request_body(event)
        selections = body.get('selections', {})
        
        if not isinstance(selections, dict):
            return create_response(400, {'error': 'Selections must be an object'})
        
        job_service = get_batch_job_service()
        
        # Verify job exists
        job = job_service.get_job_status(job_id)
        if not job:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        # Save selections
        success = job_service.save_user_selections(job_id, selections)
        
        if success:
            return create_response(200, {
                'jobId': job_id,
                'message': 'Selections saved successfully',
                'selectionsCount': len(selections)
            })
        else:
            return create_response(500, {
                'error': 'Failed to save selections',
                'jobId': job_id
            })
        
    except Exception as e:
        logger.error(f"Error saving selections: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})


def handle_internal_process_job(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Handle internal async job processing.
    
    This is called asynchronously by Lambda invoke from _handle_async_batch_search.
    It processes the batch job and updates DynamoDB with results.
    
    Supports two modes:
    1. PARALLEL: Invokes multiple worker Lambdas to process chunks simultaneously
    2. SEQUENTIAL: Falls back to sequential processing within this Lambda
    
    Args:
        event: Lambda event
        context: Lambda context (optional, used for timeout detection)
    """
    try:
        body = get_request_body(event)
        job_id = body.get('jobId')
        resume = body.get('resume', False)  # Whether this is a resume operation
        use_parallel = body.get('useParallelWorkers', True)  # Default to parallel
        
        if not job_id:
            logger.error("Internal process job called without jobId")
            return create_response(400, {'error': 'Missing jobId'})
        
        logger.info(f"Starting internal processing for job {job_id} (resume={resume}, parallel={use_parallel})")
        
        job_service = get_batch_job_service()
        
        # Get job from DynamoDB
        job = job_service.get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found")
            return create_response(404, {'error': 'Job not found'})
        
        # Check job status
        current_status = job.get('status')
        
        # For resume operations, allow processing/partial jobs
        if resume:
            if current_status not in [JobStatus.PROCESSING, JobStatus.PARTIAL]:
                logger.info(f"Job {job_id} cannot be resumed (status: {current_status})")
                return create_response(400, {'error': f'Cannot resume job with status: {current_status}'})
        else:
            # For new processing, only allow pending/processing
            if current_status not in [JobStatus.PENDING, JobStatus.PROCESSING]:
                logger.info(f"Job {job_id} already in state {current_status}, skipping")
                return create_response(200, {'message': 'Job already processed', 'status': current_status})
        
        # Get items from job record
        items = job.get('inputItems', [])
        search_params = job.get('searchParams', {})
        
        if not items:
            logger.error(f"Job {job_id} has no items to process")
            job_service.update_job_status(job_id, JobStatus.FAILED, "No items to process")
            return create_response(400, {'error': 'No items to process'})
        
        # Determine start index for resumption
        start_from_index = 0
        if resume or current_status == JobStatus.PROCESSING or current_status == JobStatus.PARTIAL:
            start_from_index = job.get('processedItems', 0)
            logger.info(f"Resuming job {job_id} from item {start_from_index}")
        
        # Use parallel workers if enabled and batch is large enough
        if use_parallel and len(items) - start_from_index > CHUNK_SIZE:
            completed = _process_batch_job_parallel(
                job_id=job_id,
                items=items,
                search_params=search_params,
                job_service=job_service,
                start_from_index=start_from_index,
                lambda_context=context
            )
        else:
            # Fall back to sequential for small batches
            completed = _process_batch_job(
                job_id=job_id,
                items=items,
                search_params=search_params,
                job_service=job_service,
                start_from_index=start_from_index,
                lambda_context=context
            )
        
        if completed:
            logger.info(f"Completed processing job {job_id}")
            return create_response(200, {'message': 'Job processed', 'jobId': job_id})
        else:
            logger.info(f"Job {job_id} marked as partial due to timeout")
            return create_response(200, {'message': 'Job partially processed, can be resumed', 'jobId': job_id, 'status': 'partial'})
        
    except Exception as e:
        logger.error(f"Error in internal job processing: {str(e)}", exc_info=True)
        # Mark job as partial (not failed) so it can be resumed
        try:
            job_id = get_request_body(event).get('jobId')
            if job_id:
                job_service = get_batch_job_service()
                # Get current progress before marking
                job = job_service.get_job(job_id)
                if job and job.get('processedItems', 0) > 0:
                    # Has partial results - mark as partial so it can be resumed
                    job_service.update_job_status(job_id, JobStatus.PARTIAL, f"Interrupted: {str(e)}")
                else:
                    job_service.update_job_status(job_id, JobStatus.FAILED, str(e))
        except Exception:
            pass
        return create_response(500, {'error': 'Internal server error'})


def handle_batch_search_resume(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST /batch-search/resume/{jobId} requests.
    
    Resumes a partial or processing job from where it left off.
    """
    try:
        job_id = get_path_parameter(event, 'jobId')
        if not job_id:
            return create_response(400, {'error': 'Missing jobId parameter'})
        
        job_service = get_batch_job_service()
        
        # Get job
        job = job_service.get_job(job_id)
        if not job:
            return create_response(404, {'error': 'Job not found', 'jobId': job_id})
        
        current_status = job.get('status')
        processed_items = job.get('processedItems', 0)
        total_items = job.get('totalItems', 0)
        
        # Only allow resuming partial or stuck processing jobs
        if current_status not in [JobStatus.PARTIAL, JobStatus.PROCESSING]:
            return create_response(400, {
                'error': 'Cannot resume job',
                'jobId': job_id,
                'status': current_status,
                'message': f'Job is {current_status}. Only partial or processing jobs can be resumed.'
            })
        
        # Check if there's actually more to process
        if processed_items >= total_items:
            # Job is actually complete, just status wasn't updated
            summary = {
                'total': total_items,
                'found': job.get('successfulItems', 0),
                'notFound': total_items - job.get('successfulItems', 0) - job.get('failedItems', 0),
                'failed': job.get('failedItems', 0)
            }
            job_service.complete_job(job_id, summary)
            return create_response(200, {
                'jobId': job_id,
                'status': 'completed',
                'message': 'Job was already complete',
                'summary': summary
            })
        
        logger.info(f"Resuming job {job_id} from item {processed_items}/{total_items}")
        
        # Trigger async processing with resume flag
        try:
            lambda_client = _get_lambda_client()
            function_name = os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'product-search-service-dev-searchApi')
            
            async_event = {
                'httpMethod': 'POST',
                'path': '/internal/process-batch-job',
                'body': json.dumps({
                    'jobId': job_id,
                    'action': 'process_batch_job',
                    'resume': True
                }),
                'headers': {},
                'isBase64Encoded': False,
                '_internal': True
            }
            
            lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='Event',
                Payload=json.dumps(async_event)
            )
            
            logger.info(f"Triggered async resume for job {job_id}")
            
        except Exception as e:
            logger.error(f"Failed to trigger async resume for job {job_id}: {str(e)}")
            return create_response(500, {'error': 'Failed to resume job', 'details': str(e)})
        
        return create_response(202, {
            'jobId': job_id,
            'status': JobStatus.PROCESSING,
            'message': f'Resuming from item {processed_items}',
            'progress': {
                'processed': processed_items,
                'total': total_items,
                'remaining': total_items - processed_items
            }
        })
        
    except Exception as e:
        logger.error(f"Error resuming job: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})
