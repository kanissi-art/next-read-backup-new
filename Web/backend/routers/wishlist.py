from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.get("")
async def get_wishlist(current_user=Depends(get_current_user)):
    """Get user's wishlist"""
    db = get_db()
    
    wishlist = db.table("wishlists").select("*, ebooks(*, categories(name), authors(name))").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    
    return success_response(wishlist.data)

@router.post("/{ebook_id}")
async def add_to_wishlist(ebook_id: int, current_user=Depends(get_current_user)):
    """Add ebook to wishlist"""
    db = get_db()
    
    # Check if already in wishlist
    existing = db.table("wishlists").select("id").eq("user_id", current_user["id"]).eq("ebook_id", ebook_id).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already in wishlist")
    
    # Add to wishlist
    new_item = db.table("wishlists").insert({
        "user_id": current_user["id"],
        "ebook_id": ebook_id
    }).execute()
    
    return success_response(new_item.data[0], "Added to wishlist")

@router.delete("/{ebook_id}")
async def remove_from_wishlist(ebook_id: int, current_user=Depends(get_current_user)):
    """Remove ebook from wishlist"""
    db = get_db()
    
    db.table("wishlists").delete().eq("user_id", current_user["id"]).eq("ebook_id", ebook_id).execute()
    
    return success_response(message="Removed from wishlist")