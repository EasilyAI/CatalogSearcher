"""
Batch Search Job Service

Handles CRUD operations for batch search jobs stored in DynamoDB.
Supports incremental saves (chunked results) for resilience.
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal
import json

import boto3
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Job status constants
class JobStatus:
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    PARTIAL = 'partial'  # Some items succeeded, some failed
    CANCELLED = 'cancelled'


class BatchJobService:
    """
    Service for managing batch search jobs in DynamoDB.
    """
    
    # How many items to accumulate before writing a chunk to DynamoDB
    CHUNK_SIZE = 20
    
    # TTL for jobs (7 days in seconds)
    JOB_TTL_DAYS = 7
    
    def __init__(self):
        """Initialize DynamoDB client."""
        self.table_name = os.getenv('BATCH_SEARCH_JOBS_TABLE', 'hb-batch-search-jobs')
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"BatchJobService initialized with table: {self.table_name}")
    
    def _generate_job_id(self) -> str:
        """Generate a unique job ID."""
        return str(uuid.uuid4())
    
    def _get_ttl(self) -> int:
        """Get TTL timestamp for job expiration."""
        return int((datetime.utcnow() + timedelta(days=self.JOB_TTL_DAYS)).timestamp())
    
    def _serialize_for_dynamodb(self, obj: Any) -> Any:
        """
        Convert Python objects to DynamoDB-compatible types.
        Handles floats -> Decimal conversion.
        """
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: self._serialize_for_dynamodb(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._serialize_for_dynamodb(item) for item in obj]
        return obj
    
    def _deserialize_from_dynamodb(self, obj: Any) -> Any:
        """
        Convert DynamoDB types back to Python types.
        Handles Decimal -> float conversion.
        """
        if isinstance(obj, Decimal):
            # Convert to int if it's a whole number, otherwise float
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        elif isinstance(obj, dict):
            return {k: self._deserialize_from_dynamodb(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._deserialize_from_dynamodb(item) for item in obj]
        return obj
    
    def create_job(
        self,
        user_id: str,
        total_items: int,
        file_name: Optional[str] = None,
        search_params: Optional[Dict[str, Any]] = None,
        items: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Create a new batch search job.
        
        Args:
            user_id: Cognito user ID or session identifier
            total_items: Total number of items to process
            file_name: Original file name (optional)
            search_params: Search parameters (size, useAI, etc.)
            items: Original input items for retry capability
            
        Returns:
            Created job record
        """
        job_id = self._generate_job_id()
        now = datetime.utcnow().isoformat()
        
        job = {
            'jobId': job_id,
            'userId': user_id,
            'status': JobStatus.PENDING,
            'createdAt': now,
            'updatedAt': now,
            'ttl': self._get_ttl(),
            
            # Input
            'totalItems': total_items,
            'fileName': file_name or '',
            'searchParams': self._serialize_for_dynamodb(search_params or {}),
            'inputItems': self._serialize_for_dynamodb(items or []),
            
            # Progress tracking
            'processedItems': 0,
            'successfulItems': 0,
            'failedItems': 0,
            'currentChunk': 0,
            'totalChunks': (total_items + self.CHUNK_SIZE - 1) // self.CHUNK_SIZE,
            
            # Results (will be populated incrementally)
            'results': [],
            
            # Failed items tracking
            'failedItemIndices': [],
            'errors': [],
            
            # Summary (populated on completion)
            'summary': None
        }
        
        self.table.put_item(Item=job)
        logger.info(f"Created batch job {job_id} for user {user_id} with {total_items} items")
        
        return self._deserialize_from_dynamodb(job)
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a job by ID.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job record or None if not found
        """
        try:
            response = self.table.get_item(Key={'jobId': job_id})
            item = response.get('Item')
            if item:
                return self._deserialize_from_dynamodb(item)
            return None
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {str(e)}")
            return None
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get lightweight job status (without full results).
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status info or None if not found
        """
        try:
            response = self.table.get_item(
                Key={'jobId': job_id},
                ProjectionExpression='jobId, #s, processedItems, totalItems, successfulItems, failedItems, createdAt, updatedAt',
                ExpressionAttributeNames={'#s': 'status'}
            )
            item = response.get('Item')
            if item:
                return self._deserialize_from_dynamodb(item)
            return None
        except Exception as e:
            logger.error(f"Error getting job status {job_id}: {str(e)}")
            return None
    
    def get_jobs_by_user(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get jobs for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of jobs to return
            
        Returns:
            List of job records (without full results)
        """
        try:
            response = self.table.query(
                IndexName='userId-index',
                KeyConditionExpression=Key('userId').eq(user_id),
                ProjectionExpression='jobId, #s, totalItems, processedItems, fileName, createdAt, updatedAt',
                ExpressionAttributeNames={'#s': 'status'},
                Limit=limit,
                ScanIndexForward=False  # Most recent first
            )
            items = response.get('Items', [])
            return [self._deserialize_from_dynamodb(item) for item in items]
        except Exception as e:
            logger.error(f"Error getting jobs for user {user_id}: {str(e)}")
            return []
    
    def update_job_status(
        self,
        job_id: str,
        status: str,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Update job status.
        
        Args:
            job_id: Job ID
            status: New status
            error_message: Optional error message
            
        Returns:
            True if successful
        """
        try:
            update_expr = 'SET #s = :status, updatedAt = :now'
            expr_values = {
                ':status': status,
                ':now': datetime.utcnow().isoformat()
            }
            expr_names = {'#s': 'status'}
            
            if error_message:
                update_expr += ', errorMessage = :error'
                expr_values[':error'] = error_message
            
            self.table.update_item(
                Key={'jobId': job_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
                ExpressionAttributeNames=expr_names
            )
            logger.info(f"Updated job {job_id} status to {status}")
            return True
        except Exception as e:
            logger.error(f"Error updating job {job_id} status: {str(e)}")
            return False
    
    def update_job_progress(
        self,
        job_id: str,
        processed_count: int,
        successful_count: int,
        failed_count: int
    ) -> bool:
        """
        Update job progress counters without adding results.
        Used for progress tracking in parallel processing.
        
        Args:
            job_id: Job ID
            processed_count: Total items processed
            successful_count: Items with matches
            failed_count: Items that failed
            
        Returns:
            True if successful
        """
        try:
            self.table.update_item(
                Key={'jobId': job_id},
                UpdateExpression='SET processedItems = :processed, successfulItems = :successful, failedItems = :failed, updatedAt = :now',
                ExpressionAttributeValues={
                    ':processed': processed_count,
                    ':successful': successful_count,
                    ':failed': failed_count,
                    ':now': datetime.utcnow().isoformat()
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error updating job {job_id} progress: {str(e)}")
            return False
    
    def append_results_chunk(
        self,
        job_id: str,
        results: List[Dict[str, Any]],
        processed_count: int,
        successful_count: int,
        failed_count: int,
        max_retries: int = 3
    ) -> bool:
        """
        Append a chunk of results to the job with retry logic.
        
        Args:
            job_id: Job ID
            results: List of result items to append
            processed_count: Total processed items so far
            successful_count: Total successful items so far
            failed_count: Total failed items so far
            max_retries: Maximum number of retry attempts
            
        Returns:
            True if successful
        """
        import time
        
        serialized_results = self._serialize_for_dynamodb(results)
        
        for attempt in range(max_retries):
            try:
                self.table.update_item(
                    Key={'jobId': job_id},
                    UpdateExpression='''
                        SET results = list_append(if_not_exists(results, :empty_list), :new_results),
                            processedItems = :processed,
                            successfulItems = :successful,
                            failedItems = :failed,
                            currentChunk = currentChunk + :one,
                            updatedAt = :now,
                            #s = :status
                    ''',
                    ExpressionAttributeValues={
                        ':new_results': serialized_results,
                        ':empty_list': [],
                        ':processed': processed_count,
                        ':successful': successful_count,
                        ':failed': failed_count,
                        ':one': 1,
                        ':now': datetime.utcnow().isoformat(),
                        ':status': JobStatus.PROCESSING
                    },
                    ExpressionAttributeNames={'#s': 'status'}
                )
                logger.info(f"Appended {len(results)} results to job {job_id} (processed: {processed_count})")
                return True
            except Exception as e:
                logger.error(f"Error appending results to job {job_id} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    # Exponential backoff: 0.5s, 1s, 2s
                    wait_time = 0.5 * (2 ** attempt)
                    logger.info(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)
        
        logger.error(f"FAILED to append {len(results)} results to job {job_id} after {max_retries} attempts!")
        return False
    
    def add_failed_item(
        self,
        job_id: str,
        item_index: int,
        error: str,
        retryable: bool = True
    ) -> bool:
        """
        Record a failed item.
        
        Args:
            job_id: Job ID
            item_index: Index of the failed item
            error: Error message
            retryable: Whether the item can be retried
            
        Returns:
            True if successful
        """
        try:
            error_record = {
                'itemIndex': item_index,
                'error': error,
                'retryable': retryable,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            self.table.update_item(
                Key={'jobId': job_id},
                UpdateExpression='''
                    SET failedItemIndices = list_append(if_not_exists(failedItemIndices, :empty_list), :index_list),
                        errors = list_append(if_not_exists(errors, :empty_list), :error_list),
                        updatedAt = :now
                ''',
                ExpressionAttributeValues={
                    ':index_list': [item_index],
                    ':error_list': [error_record],
                    ':empty_list': [],
                    ':now': datetime.utcnow().isoformat()
                }
            )
            logger.info(f"Added failed item {item_index} to job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding failed item to job {job_id}: {str(e)}")
            return False
    
    def complete_job(
        self,
        job_id: str,
        summary: Dict[str, Any]
    ) -> bool:
        """
        Mark job as completed with summary.
        
        Args:
            job_id: Job ID
            summary: Summary statistics
            
        Returns:
            True if successful
        """
        try:
            # Determine final status based on failures
            failed_count = summary.get('failed', 0)
            total_count = summary.get('total', 0)
            
            if failed_count == 0:
                status = JobStatus.COMPLETED
            elif failed_count == total_count:
                status = JobStatus.FAILED
            else:
                status = JobStatus.PARTIAL
            
            self.table.update_item(
                Key={'jobId': job_id},
                UpdateExpression='''
                    SET #s = :status,
                        summary = :summary,
                        updatedAt = :now
                ''',
                ExpressionAttributeValues={
                    ':status': status,
                    ':summary': self._serialize_for_dynamodb(summary),
                    ':now': datetime.utcnow().isoformat()
                },
                ExpressionAttributeNames={'#s': 'status'}
            )
            logger.info(f"Completed job {job_id} with status {status}")
            return True
        except Exception as e:
            logger.error(f"Error completing job {job_id}: {str(e)}")
            return False
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job.
        
        Args:
            job_id: Job ID
            
        Returns:
            True if successful
        """
        return self.update_job_status(job_id, JobStatus.CANCELLED)
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete a job from the database.
        
        Args:
            job_id: Job ID
            
        Returns:
            True if successful
        """
        try:
            self.table.delete_item(Key={'jobId': job_id})
            logger.info(f"Deleted job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting job {job_id}: {str(e)}")
            return False
    
    def save_user_selections(self, job_id: str, selections: Dict[str, str]) -> bool:
        """
        Save user's match selections for a job.
        
        Args:
            job_id: Job ID
            selections: Dict mapping item index to selected match ID
            
        Returns:
            True if successful
        """
        try:
            self.table.update_item(
                Key={'jobId': job_id},
                UpdateExpression='SET userSelections = :selections, updatedAt = :now',
                ExpressionAttributeValues={
                    ':selections': selections,
                    ':now': datetime.utcnow().isoformat()
                }
            )
            logger.info(f"Saved {len(selections)} user selections for job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving user selections for job {job_id}: {str(e)}")
            return False
    
    def get_failed_items_for_retry(self, job_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get the original input items that failed, for retry.
        
        Args:
            job_id: Job ID
            
        Returns:
            List of original input items that failed, or None if job not found
        """
        job = self.get_job(job_id)
        if not job:
            return None
        
        failed_indices = set(job.get('failedItemIndices', []))
        input_items = job.get('inputItems', [])
        
        if not failed_indices or not input_items:
            return []
        
        # Return only the items that failed
        return [
            {'originalIndex': i, 'item': item}
            for i, item in enumerate(input_items)
            if i in failed_indices
        ]


# Singleton instance
_batch_job_service: Optional[BatchJobService] = None


def get_batch_job_service() -> BatchJobService:
    """Get or create singleton BatchJobService instance."""
    global _batch_job_service
    if _batch_job_service is None:
        _batch_job_service = BatchJobService()
    return _batch_job_service

