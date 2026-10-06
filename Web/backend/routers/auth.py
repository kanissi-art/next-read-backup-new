"""
Authentication router for E-Book Mart API
Handles user registration, login, and profile management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.user import UserRegister, UserLogin, UserResponse, UserUpdate
from utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from utils.response import success_response
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register new user
    """
    db = get_db()
    
    # Check if email already exists
    existing_user = db.table("users").select("id").eq("email", user_data.email).execute()
    if existing_user.data and len(existing_user.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Get customer role
    role = db.table("roles").select("id").eq("name", "customer").execute()
    if not role.data or len(role.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Role not found"
        )
    
    # Hash password
    password_hash = get_password_hash(user_data.password)
    
    # Create new user
    new_user = db.table("users").insert({
        "role_id": role.data[0]["id"],
        "email": user_data.email,
        "password_hash": password_hash,
        "name": user_data.name,
        "phone": user_data.phone,
        "address": user_data.address,
        "is_active": True
    }).execute()
    
    # Create cart for new user
    db.table("carts").insert({
        "user_id": new_user.data[0]["id"],
        "status": "active"
    }).execute()
    
    return success_response(
        data={
            "id": new_user.data[0]["id"],
            "email": new_user.data[0]["email"],
            "name": new_user.data[0]["name"]
        },
        message="User registered successfully"
    )


@router.post("/login")
async def login(user_data: UserLogin):
    """
    Login user and return access token
    """
    db = get_db()
    
    # Find user by email
    user_result = db.table("users").select("*, roles(name)").eq("email", user_data.email).execute()
    
    if not user_result.data or len(user_result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user = user_result.data[0]
    
    # Verify password
    if not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if user is active
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return success_response(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["roles"]["name"] if user.get("roles") else "customer"
            }
        }
    )


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """
    Get current user information
    """
    return success_response(data=current_user)


@router.put("/me")
async def update_me(
    user_data: UserUpdate,
    current_user=Depends(get_current_user)
):
    """
    Update current user profile
    """
    db = get_db()
    
    # Prepare update data (only non-None values)
    update_data = {
        key: value for key, value in user_data.dict().items()
        if value is not None
    }
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data to update"
        )
    
    # Update user
    updated_user = db.table("users").update(update_data).eq("id", current_user["id"]).execute()
    
    if not updated_user.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )
    
    return success_response(
        data=updated_user.data[0],
        message="User updated successfully"
    )


@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    """
    Logout user (client should remove token)
    """
    return success_response(message="Logged out successfully")