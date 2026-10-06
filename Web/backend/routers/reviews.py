from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.review import ReviewCreate
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.get("/ebook/{ebook_id}")
async def get_reviews(ebook_id: int):
    """Get reviews for an ebook"""
    db = get_db()
    
    reviews = db.table("reviews").select("*, users(name)").eq("ebook_id", ebook_id).order("created_at", desc=True).execute()
    
    return success_response(reviews.data)

@router.post("/ebook/{ebook_id}")
async def create_review(ebook_id: int, review_data: ReviewCreate, current_user=Depends(get_current_user)):
    """Create review for an ebook"""
    db = get_db()
    
    # Check if user purchased this ebook
    purchased = db.table("order_items").select("id").eq("ebook_id", ebook_id).execute()
    
    # For simplicity, allow any user to review (in production, check if purchased)
    
    # Check if already reviewed
    existing = db.table("reviews").select("id").eq("user_id", current_user["id"]).eq("ebook_id", ebook_id).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already reviewed this ebook")
    
    # Create review
    new_review = db.table("reviews").insert({
        "user_id": current_user["id"],
        "ebook_id": ebook_id,
        "rating": review_data.rating,
        "comment": review_data.comment
    }).execute()
    
    return success_response(new_review.data[0], "Review created")