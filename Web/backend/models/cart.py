from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class CartItemCreate(BaseModel):
    ebook_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    ebook_id: int
    title: str
    price: Decimal
    quantity: int
    subtotal: Decimal

class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    total: Decimal