from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class EbookCreate(BaseModel):
    category_id: int
    author_id: int
    title: str
    description: Optional[str] = None
    price: Decimal
    cover_url: Optional[str] = None
    download_url: Optional[str] = None
    stock: int = 0

class EbookUpdate(BaseModel):
    category_id: Optional[int] = None
    author_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    cover_url: Optional[str] = None
    download_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None

class EbookResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price: Decimal
    cover_url: Optional[str]
    stock: int
    is_active: bool
    category_name: str
    author_name: str
    created_at: datetime