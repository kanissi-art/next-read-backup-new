from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth, ebooks, cart, orders, reviews, wishlist, admin, categories, authors

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(ebooks.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(wishlist.router)
app.include_router(admin.router)
app.include_router(categories.router)    # ✅ เพิ่ม
app.include_router(authors.router)       # ✅ เพิ่ม

@app.get("/")
async def root():
    return {"message": "Welcome to E-Book Mart API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)