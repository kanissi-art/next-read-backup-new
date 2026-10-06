from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from utils.auth import get_current_admin
from utils.response import success_response

router = APIRouter(prefix="/api/authors", tags=["Authors"])


class AuthorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    bio: Optional[str] = None


@router.get("")
async def get_authors():
    """Get all authors (public)"""
    db = get_db()
    authors = db.table("authors").select("*").order("name").execute()
    return success_response(authors.data)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_author(author_data: AuthorCreate, admin=Depends(get_current_admin)):
    """Create an author (admin only)."""
    name = author_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Author name is required")

    db = get_db()
    existing = db.table("authors").select("id").ilike("name", name).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Author already exists")

    author = db.table("authors").insert({
        "name": name,
        "bio": author_data.bio.strip() if author_data.bio else None,
    }).execute()
    return success_response(author.data[0], "Author created")


@router.delete("/{author_id}")
async def delete_author(author_id: int, admin=Depends(get_current_admin)):
    """Delete an author only when no ebooks reference it."""
    db = get_db()
    author = db.table("authors").select("id").eq("id", author_id).execute()
    if not author.data:
        raise HTTPException(status_code=404, detail="Author not found")

    linked_ebooks = db.table("ebooks").select("id").eq("author_id", author_id).limit(1).execute()
    if linked_ebooks.data:
        raise HTTPException(
            status_code=409,
            detail="Author is used by one or more books",
        )

    db.table("authors").delete().eq("id", author_id).execute()
    return success_response(message="Author deleted")