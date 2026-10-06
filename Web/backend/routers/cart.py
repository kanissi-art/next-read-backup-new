from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.cart import CartItemCreate, CartItemUpdate
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("")
async def get_cart(current_user=Depends(get_current_user)):
    """Get current user's cart"""
    db = get_db()
    
    # Get cart
    cart = db.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not cart.data:
        return success_response({"items": [], "total": 0})
    
    cart_data = cart.data[0]
    
    # Get cart items
    cart_items = db.table("cart_items").select("*").eq("cart_id", cart_data["id"]).execute()
    
    items = []
    total = 0
    
    for item in cart_items.data:
        # Get ebook details
        ebook = db.table("ebooks").select("*").eq("id", item["ebook_id"]).execute()
        
        if ebook.data:
            ebook_data = ebook.data[0]
            subtotal = ebook_data["price"] * item["quantity"]
            
            items.append({
                "id": item["id"],
                "ebook_id": item["ebook_id"],
                "title": ebook_data["title"],
                "price": ebook_data["price"],
                "cover_url": ebook_data["cover_url"],
                "author_name": "ไม่ระบุ",
                "quantity": item["quantity"],
                "subtotal": subtotal
            })
            total += subtotal
    
    return success_response({
        "id": cart_data["id"],
        "items": items,
        "total": total
    })


@router.post("/items", status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user=Depends(get_current_user)
):
    """Add item to cart"""
    db = get_db()
    
    # 1. Get or create cart
    cart = db.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not cart.data:
        cart = db.table("carts").insert({
            "user_id": current_user["id"],
            "status": "active"
        }).execute()
        cart_id = cart.data[0]["id"]
    else:
        cart_id = cart.data[0]["id"]
    
    # 2. Check if item already in cart
    existing = db.table("cart_items").select("*").eq("cart_id", cart_id).eq("ebook_id", item_data.ebook_id).execute()
    
    if existing.data:
        # Update quantity
        new_quantity = existing.data[0]["quantity"] + item_data.quantity
        db.table("cart_items").update({"quantity": new_quantity}).eq("id", existing.data[0]["id"]).execute()
    else:
        # ✅ 3. FIX: ดึงราคาสินค้าจากตาราง ebooks มาก่อน!
        ebook = db.table("ebooks").select("price").eq("id", item_data.ebook_id).execute()
        
        if not ebook.data:
            raise HTTPException(status_code=404, detail="Ebook not found")
        
        ebook_price = ebook.data[0]["price"]
        
        # ✅ 4. เพิ่ม price เข้าไปใน payload ที่จะ insert
        db.table("cart_items").insert({
            "cart_id": cart_id,
            "ebook_id": item_data.ebook_id,
            "quantity": item_data.quantity,
            "price": ebook_price  # <--- เพิ่มบรรทัดนี้
        }).execute()
    
    return success_response(message="Item added to cart")


@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user=Depends(get_current_user)
):
    """Update cart item quantity"""
    db = get_db()
    
    # Verify item belongs to user's cart
    cart = db.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not cart.data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_item = db.table("cart_items").select("*").eq("id", item_id).eq("cart_id", cart.data[0]["id"]).execute()
    
    if not cart_item.data:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    db.table("cart_items").update({"quantity": item_data.quantity}).eq("id", item_id).execute()
    
    return success_response(message="Cart updated")


@router.delete("/items/{item_id}")
async def remove_cart_item(
    item_id: int,
    current_user=Depends(get_current_user)
):
    """Remove item from cart"""
    db = get_db()
    
    # Verify item belongs to user's cart
    cart = db.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not cart.data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_item = db.table("cart_items").select("*").eq("id", item_id).eq("cart_id", cart.data[0]["id"]).execute()
    
    if not cart_item.data:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    db.table("cart_items").delete().eq("id", item_id).execute()
    
    return success_response(message="Item removed from cart")