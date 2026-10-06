from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class OrderCreate(BaseModel):
    payment_method: str
    slip_url: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    ebook_id: int
    title: str
    price: Decimal
    quantity: int
    subtotal: Decimal
    download_token: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    total_amount: Decimal
    status: str
    payment_slip_url: Optional[str]
    notes: Optional[str]
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

class PaymentCreate(BaseModel):
    payment_method: str
    slip_url: str