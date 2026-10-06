from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("")
async def get_categories():
    """Get all active categories (public)"""
    db = get_db()
    categories = db.table("categories").select("*").eq("is_active", True).order("name").execute()
    return success_response(categories.data)