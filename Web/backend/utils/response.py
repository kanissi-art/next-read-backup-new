from typing import Any, Optional
from pydantic import BaseModel

class ResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

def success_response(data: Any = None, message: str = "Success"):
    return ResponseModel(success=True, message=message, data=data)

def error_response(message: str = "Error", status_code: int = 400):
    return {"success": False, "message": message}