import requests

BASE_URL = "http://localhost:8000"

# 1. Login
print("=== Step 1: Login ===")
login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "customer1@email.com",
    "password": "password123"
})
print(f"Login status: {login_response.status_code}")
token = login_response.json()["data"]["access_token"]
print(f"Token: {token[:50]}...")

# 2. Add to cart
print("\n=== Step 2: Add to cart ===")
headers = {"Authorization": f"Bearer {token}"}
cart_response = requests.post(
    f"{BASE_URL}/api/cart/items",
    headers=headers,
    json={"ebook_id": 10, "quantity": 1}
)
print(f"Cart status: {cart_response.status_code}")
print(f"Response: {cart_response.json()}")