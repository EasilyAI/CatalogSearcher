"""
Batch Search Worker Lambda

Dedicated Lambda function for processing chunks of batch search items in parallel.
Invoked by the main searchApi Lambda to enable parallel processing of large batches.

This worker:
1. Receives a chunk of items to process
2. Performs vector search + reranking for each item
3. Returns results directly (synchronous invocation)

By running multiple workers in parallel, we can process a 200+ item batch
in a fraction of the time compared to sequential processing.
"""

import logging
import os
import json
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Import shared modules
from .utils import get_search_service
from .rerank_openai import rerank_results, batch_rerank_results

# Configuration - optimized for speed
BATCH_RERANK_SIZE = int(os.getenv('OPENAI_BATCH_RERANK_SIZE', '20'))
MAX_SEARCH_WORKERS = int(os.getenv('MAX_SEARCH_WORKERS', '25'))  # More parallel searches
SEARCH_RESULT_SIZE = int(os.getenv('SEARCH_RESULT_SIZE', '10'))  # Fewer candidates = faster


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Batch worker Lambda handler.
    
    Processes a chunk of items and returns search results.
    
    Event structure:
    {
        "items": [...],  # Items to process
        "startIndex": 0,  # Starting index for result mapping
        "searchParams": {
            "size": 15,
            "min_score": 0.0,
            "use_ai": true,
            "result_size": 5
        },
        "jobId": "...",  # For logging/tracking
        "workerId": 0    # Worker ID for logging
    }
    
    Returns:
    {
        "results": [...],
        "processedCount": N,
        "successfulCount": N,
        "failedCount": N,
        "workerId": N
    }
    """
    try:
        items = event.get('items', [])
        start_index = event.get('startIndex', 0)
        search_params = event.get('searchParams', {})
        job_id = event.get('jobId', 'unknown')
        worker_id = event.get('workerId', 0)
        
        if not items:
            logger.warning(f"Worker {worker_id}: No items to process")
            return {
                'results': [],
                'processedCount': 0,
                'successfulCount': 0,
                'failedCount': 0,
                'workerId': worker_id
            }
        
        logger.info(f"Worker {worker_id}: Processing {len(items)} items for job {job_id}, starting at index {start_index}")
        
        # Extract search params
        size = min(search_params.get('size', 30), SEARCH_RESULT_SIZE)
        min_score = search_params.get('min_score', 0.0)
        should_use_ai = search_params.get('use_ai', True)
        num_results_to_return = search_params.get('result_size', 5)
        
        # Process items
        results = _process_items_with_batch_rerank(
            items=items,
            start_index=start_index,
            size=size,
            min_score=min_score,
            should_use_ai=should_use_ai,
            num_results_to_return=num_results_to_return
        )
        
        # Count results
        successful_count = 0
        failed_count = 0
        for result in results:
            if result.get('error'):
                failed_count += 1
            elif result.get('matches') and len(result['matches']) > 0:
                successful_count += 1
        
        logger.info(f"Worker {worker_id}: Completed {len(results)} items (success: {successful_count}, failed: {failed_count})")
        
        return {
            'results': results,
            'processedCount': len(results),
            'successfulCount': successful_count,
            'failedCount': failed_count,
            'workerId': worker_id
        }
        
    except Exception as e:
        logger.error(f"Worker error: {str(e)}", exc_info=True)
        return {
            'error': str(e),
            'results': [],
            'processedCount': 0,
            'successfulCount': 0,
            'failedCount': 0,
            'workerId': event.get('workerId', 0)
        }


def _process_items_with_batch_rerank(
    items: List[Dict[str, Any]],
    start_index: int,
    size: int,
    min_score: float,
    should_use_ai: bool,
    num_results_to_return: int
) -> List[Dict[str, Any]]:
    """
    Process items with parallel vector search and batch reranking.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    service = get_search_service()
    
    # Phase 1: Execute all vector searches in parallel
    initial_results = []
    items_needing_rerank = []
    
    def search_item_no_rerank(item: Dict[str, Any], index: int):
        """Search a single item without reranking."""
        ordering_number = item.get('orderingNumber', '').strip() if item.get('orderingNumber') else None
        description = item.get('description', '').strip() if item.get('description') else None
        category = item.get('productCategory') or item.get('productType')
        quantity = item.get('quantity', 1)
        
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
                
                return (index, {
                    'itemIndex': start_index + index,
                    'query': description,
                    'category': category,
                    'quantity': quantity,
                    'matches': []
                }, description, search_results)
                
        except Exception as e:
            logger.error(f"Error searching item {start_index + index}: {str(e)}")
            return (index, {
                'itemIndex': start_index + index,
                'query': ordering_number or description or 'N/A',
                'category': category,
                'quantity': quantity,
                'matches': [],
                'error': str(e)
            }, None, [])
    
    # Execute searches in parallel
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
        
        for batch_start in range(0, len(items_needing_rerank), BATCH_RERANK_SIZE):
            batch_end = min(batch_start + BATCH_RERANK_SIZE, len(items_needing_rerank))
            batch = items_needing_rerank[batch_start:batch_end]
            
            queries_with_results = [
                {
                    'query': desc,
                    'results': results,
                    'itemIndex': start_index + idx
                }
                for idx, desc, results, _ in batch
            ]
            
            try:
                reranked_batch = batch_rerank_results(
                    queries_with_results=queries_with_results,
                    top_k=num_results_to_return
                )
                
                for reranked_item in reranked_batch:
                    item_index = reranked_item['itemIndex']
                    reranked_results = reranked_item['results']
                    
                    for i, (idx, result, desc, _) in enumerate(initial_results):
                        if start_index + idx == item_index:
                            category = result.get('category')
                            formatted_matches = _format_matches(reranked_results, item_index, category)
                            result['matches'] = formatted_matches
                            break
                            
            except Exception as e:
                logger.error(f"Batch rerank failed: {str(e)}")
                for idx, desc, results, result in batch:
                    category = result.get('category')
                    formatted_matches = _format_matches(results[:num_results_to_return], start_index + idx, category)
                    result['matches'] = formatted_matches
    
    # Phase 4: Handle items that didn't need reranking
    for index, result, description, search_results in initial_results:
        if description and result.get('matches') == []:
            category = result.get('category')
            formatted_matches = _format_matches(search_results[:num_results_to_return], start_index + index, category)
            result['matches'] = formatted_matches
    
    return [result for _, result, _, _ in initial_results]


def _format_matches(
    search_results: List[Dict[str, Any]],
    item_index: int,
    category: str
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

