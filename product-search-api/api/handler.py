"""
Search API Lambda Handler - Router

Main entry point that routes requests to appropriate endpoint handlers.
"""

import os
import logging
from typing import Dict, Any

from .utils import create_response
from .search import handle_search
from .autocomplete import handle_autocomplete
from .product import handle_get_product
from .batch_search import (
    handle_batch_search,
    handle_batch_search_status,
    handle_batch_search_results,
    handle_batch_search_retry,
    handle_batch_search_cancel,
    handle_batch_search_delete,
    handle_batch_search_resume,
    handle_batch_search_jobs,
    handle_batch_search_save_selections,
    handle_internal_process_job
)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for Search API.
    
    Routes requests to appropriate handlers based on path.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    # Handle warmup events (scheduled CloudWatch trigger to keep Lambda warm)
    if event.get('warmup') or event.get('source') == 'serverless-warmup':
        logger.info("Lambda warmup event - keeping instance warm")
        return {'statusCode': 200, 'body': 'Warmed up'}
    
    logger.info(f"Request: {event.get('requestContext', {}).get('http', {}).get('method')} {event.get('rawPath')}")
    
    # Handle internal async job processing (from Lambda invoke)
    # This is called asynchronously by _handle_async_batch_search
    if event.get('_internal') and event.get('path') == '/internal/process-batch-job':
        logger.info("Processing internal batch job request")
        return handle_internal_process_job(event, context)
    
    # Handle OPTIONS for CORS
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return create_response(200, '')
    
    # Verify authentication (API key or Cognito token)
    try:
        from shared.api_key_auth import verify_api_key, create_unauthorized_response
        
        # Check for Cognito token first (Authorization: Bearer <token>)
        headers = event.get('headers', {}) or {}
        # Try different case variations of the Authorization header
        auth_header = None
        for key in headers:
            if key.lower() == 'authorization':
                auth_header = headers[key]
                break
        
        has_cognito_token = False
        if auth_header and isinstance(auth_header, str) and auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            if token:
                # If we have a Bearer token, check if it's a valid JWT structure
                # (basic check - actual verification would be done by API Gateway authorizer)
                parts = token.split('.')
                if len(parts) == 3:  # JWT has 3 parts
                    has_cognito_token = True
                    logger.info("Request authenticated with Cognito Bearer token")
        
        # If no Cognito token, check for API key
        if not has_cognito_token:
            is_valid, error_msg = verify_api_key(event, 'product-search', require_ip_whitelist=False)
            if not is_valid:
                return create_unauthorized_response(error_msg or "Invalid or missing API key")
            logger.info("Request authenticated with API key")
    except ImportError:
        logger.warning("Shared auth module not available, skipping authentication verification")
        # In development, allow without auth if module not available
    
    # Route based on path
    path = event.get('rawPath', '').lower()
    method = event.get('requestContext', {}).get('http', {}).get('method', '').upper()
    
    # Batch search endpoints (check specific paths first)
    if '/batch-search/status/' in path:
        logger.info("Redirecting to batch search status service")
        return handle_batch_search_status(event)
    elif '/batch-search/results/' in path:
        logger.info("Redirecting to batch search results service")
        return handle_batch_search_results(event)
    elif '/batch-search/retry/' in path:
        logger.info("Redirecting to batch search retry service")
        return handle_batch_search_retry(event)
    elif '/batch-search/cancel/' in path:
        logger.info("Redirecting to batch search cancel service")
        return handle_batch_search_cancel(event)
    elif '/batch-search/jobs/' in path and '/selections' in path and method == 'PUT':
        logger.info("Redirecting to batch search save selections service")
        return handle_batch_search_save_selections(event)
    elif '/batch-search/jobs/' in path and method == 'DELETE':
        logger.info("Redirecting to batch search delete service")
        return handle_batch_search_delete(event)
    elif '/batch-search/resume/' in path:
        logger.info("Redirecting to batch search resume service")
        return handle_batch_search_resume(event)
    elif path == '/batch-search/jobs' and method == 'GET':
        logger.info("Redirecting to batch search jobs list service")
        return handle_batch_search_jobs(event)
    elif '/batch-search' in path:
        logger.info("Redirecting to batch search service")
        return handle_batch_search(event)
    elif '/search' in path:
        logger.info(f"Redirecting to search service")
        return handle_search(event)
    elif '/autocomplete' in path:
        logger.info(f"Redirecting to autocomplete service")
        return handle_autocomplete(event)
    elif '/product' in path:
        logger.info(f"Redirecting to get product service")
        return handle_get_product(event)
    else:
        return create_response(404, {
            'error': 'Not found',
            'message': 'Valid endpoints: /search, /autocomplete, /product/{orderingNumber}, /batch-search',
            'available_endpoints': [
                'GET /search?q=<query>&category=<category>&size=<size>',
                'GET /autocomplete?q=<prefix>&category=<category>&size=<size>',
                'GET /product/{orderingNumber}',
                'POST /batch-search',
                'GET /batch-search/jobs',
                'GET /batch-search/status/{jobId}',
                'GET /batch-search/results/{jobId}',
                'POST /batch-search/retry/{jobId}',
                'POST /batch-search/resume/{jobId}',
                'POST /batch-search/cancel/{jobId}',
                'DELETE /batch-search/jobs/{jobId}',
                'PUT /batch-search/jobs/{jobId}/selections'
            ]
        })
