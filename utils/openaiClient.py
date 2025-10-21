import os
import json
import base64
from typing import Optional, Dict, Any, List
from openai import OpenAI
import boto3
from urllib.parse import urlparse


class OpenAIClient:
    """
    A modest and mild OpenAI client for chat completions and file-based queries.
    """
    
    def __init__(self, api_key: Optional[str] = None, aws_access_key_id: Optional[str] = None, aws_secret_access_key: Optional[str] = None, aws_region: str = "us-east-1"):
        """
        Initialize the OpenAI client.
        
        Args:
            api_key: OpenAI API key. If not provided, will try to get from OPENAI_API_KEY env var.
            aws_access_key_id: AWS access key ID for S3 access. If not provided, will use default AWS credentials.
            aws_secret_access_key: AWS secret access key for S3 access. If not provided, will use default AWS credentials.
            aws_region: AWS region for S3 access (default: us-east-1).
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Provide it directly or set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(api_key=self.api_key)
        
        # Initialize S3 client
        try:
            if aws_access_key_id and aws_secret_access_key:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=aws_access_key_id,
                    aws_secret_access_key=aws_secret_access_key,
                    region_name=aws_region
                )
            else:
                # Use default AWS credentials (from environment, IAM role, etc.)
                self.s3_client = boto3.client('s3', region_name=aws_region)
        except Exception as e:
            print(f"Warning: Could not initialize S3 client: {e}")
            self.s3_client = None
    
    def chat_completion(self, messages: List[Dict[str, str]], model: str = "gpt-4-turbo", response_format: Optional[Dict[str, str]] = None, **kwargs) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenAI.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use for completion (default: gpt-4-turbo)
            response_format: Response format specification (e.g., {"type": "json_object"})
            **kwargs: Additional parameters to pass to the completion request
            
        Returns:
            Raw response from OpenAI API
        """
        try:
            params = {
                "model": model,
                "messages": messages,
                **kwargs
            }
            
            if response_format:
                params["response_format"] = response_format
            
            response = self.client.chat.completions.create(**params)
            return response
        except Exception as e:
            raise Exception(f"Chat completion failed: {str(e)}")
    
    def chat_completion_json(self, messages: List[Dict[str, str]], model: str = "gpt-4-turbo", **kwargs) -> Dict[str, Any]:
        """
        Send a chat completion request with structured JSON output.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use for completion (default: gpt-4-turbo)
            **kwargs: Additional parameters to pass to the completion request
            
        Returns:
            Parsed JSON content from the response
        """
        # Ensure the system message instructs to return JSON
        if not any(msg.get("role") == "system" for msg in messages):
            messages = [{"role": "system", "content": "You must respond with valid JSON only."}] + messages
        
        response = self.chat_completion(
            messages=messages,
            model=model,
            response_format={"type": "json_object"},
            **kwargs
        )
        
        return self.parse_chat_completion_json(response)
    
    def parse_chat_completion_json(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse chat completion response and extract JSON from the content.
        
        Args:
            response: Response from chat_completion method
            
        Returns:
            Parsed JSON content from the response
        """
        try:
            content = response.choices[0].message.content
            
            # For structured output, the content should be JSON directly
            if content.strip().startswith('{') or content.strip().startswith('['):
                return json.loads(content.strip())
            
            # Try to extract JSON from the content (fallback for non-structured responses)
            # Look for JSON blocks in markdown format
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            else:
                # Try to parse the entire content as JSON
                json_str = content.strip()
            
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON from response: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to extract content from response: {str(e)}")
    
    def _read_file_content(self, file_path: str) -> tuple[bytes, str]:
        """
        Read file content from local path or S3.
        
        Args:
            file_path: Local file path or S3 URI (s3://bucket/key)
            
        Returns:
            Tuple of (file_content_bytes, file_extension)
        """
        if file_path.startswith('s3://'):
            if not self.s3_client:
                raise Exception("S3 client not initialized. Please provide AWS credentials.")
            
            # Parse S3 URI
            parsed = urlparse(file_path)
            bucket = parsed.netloc
            key = parsed.path.lstrip('/')
            
            try:
                response = self.s3_client.get_object(Bucket=bucket, Key=key)
                file_content = response['Body'].read()
                file_extension = os.path.splitext(key)[1].lower()
                return file_content, file_extension
            except Exception as e:
                raise Exception(f"Failed to read from S3: {str(e)}")
        else:
            # Local file
            try:
                with open(file_path, 'rb') as file:
                    file_content = file.read()
                file_extension = os.path.splitext(file_path)[1].lower()
                return file_content, file_extension
            except FileNotFoundError:
                raise Exception(f"File not found: {file_path}")
            except Exception as e:
                raise Exception(f"Failed to read local file: {str(e)}")
    
    def query_with_file(self, file_path: str, question: str, model: str = "gpt-4-turbo") -> str:
        """
        Attach a file to a query and ask questions about it.
        Supports both local files and S3 URIs (s3://bucket/key).
        
        Args:
            file_path: Path to the file to attach (local path or S3 URI)
            question: Question to ask about the file
            model: Model to use for completion (default: gpt-4-turbo)
            
        Returns:
            Response content from the model
        """
        try:
            # Read file content (handles both local and S3)
            file_content, file_extension = self._read_file_content(file_path)
            file_base64 = base64.b64encode(file_content).decode('utf-8')
            
            # Get MIME type
            mime_types = {
                '.pdf': 'application/pdf',
                '.txt': 'text/plain',
                '.json': 'application/json',
                '.csv': 'text/csv',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(file_extension, 'application/octet-stream')
            
            # Create messages with file attachment
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": question
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{file_base64}"
                            }
                        }
                    ]
                }
            ]
            
            # Handle non-image files differently
            if file_extension not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                # For text-based files, read as text and include in the message
                try:
                    file_text = file_content.decode('utf-8')
                    messages = [
                        {
                            "role": "user",
                            "content": f"Here is the content of the file:\n\n{file_text}\n\nQuestion: {question}"
                        }
                    ]
                except UnicodeDecodeError:
                    # If can't read as text, fall back to base64 approach
                    messages = [
                        {
                            "role": "user",
                            "content": f"I've attached a file ({file_path}). Please analyze it and answer: {question}"
                        }
                    ]
            
            response = self.chat_completion(messages, model=model)
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Failed to query file: {str(e)}")
    
    def query_with_file_json(self, file_path: str, question: str, model: str = "gpt-4-turbo") -> Dict[str, Any]:
        """
        Attach a file to a query and ask questions about it, returning structured JSON output.
        Supports both local files and S3 URIs (s3://bucket/key).
        
        Args:
            file_path: Path to the file to attach (local path or S3 URI)
            question: Question to ask about the file
            model: Model to use for completion (default: gpt-4-turbo)
            
        Returns:
            Parsed JSON response from the model
        """
        try:
            # Read file content (handles both local and S3)
            file_content, file_extension = self._read_file_content(file_path)
            file_base64 = base64.b64encode(file_content).decode('utf-8')
            
            # Get MIME type
            mime_types = {
                '.pdf': 'application/pdf',
                '.txt': 'text/plain',
                '.json': 'application/json',
                '.csv': 'text/csv',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(file_extension, 'application/octet-stream')
            
            # Create messages with file attachment and JSON instruction
            messages = [
                {
                    "role": "system",
                    "content": "You must respond with valid JSON only. Analyze the provided file and answer the question in a structured JSON format."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": question
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{file_base64}"
                            }
                        }
                    ]
                }
            ]
            
            # Handle non-image files differently
            if file_extension not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                # For text-based files, read as text and include in the message
                try:
                    file_text = file_content.decode('utf-8')
                    messages = [
                        {
                            "role": "system",
                            "content": "You must respond with valid JSON only. Analyze the provided file content and answer the question in a structured JSON format."
                        },
                        {
                            "role": "user",
                            "content": f"Here is the content of the file:\n\n{file_text}\n\nQuestion: {question}"
                        }
                    ]
                except UnicodeDecodeError:
                    # If can't read as text, fall back to base64 approach
                    messages = [
                        {
                            "role": "system",
                            "content": "You must respond with valid JSON only. Analyze the provided file and answer the question in a structured JSON format."
                        },
                        {
                            "role": "user",
                            "content": f"I've attached a file ({file_path}). Please analyze it and answer: {question}"
                        }
                    ]
            
            response = self.chat_completion(
                messages=messages,
                model=model,
                response_format={"type": "json_object"}
            )
            return self.parse_chat_completion_json(response)
            
        except Exception as e:
            raise Exception(f"Failed to query file: {str(e)}")
