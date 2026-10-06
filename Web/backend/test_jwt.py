from jose import jwt
from datetime import datetime, timedelta
from config import settings

# สร้าง token ใหม่
user_id = 3  # customer1@email.com
token_data = {"sub": user_id}

# สร้าง token
access_token = jwt.encode(
    token_data, 
    settings.SECRET_KEY, 
    algorithm=settings.ALGORITHM
)

print(f"=== JWT Test ===")
print(f"SECRET_KEY: {settings.SECRET_KEY}")
print(f"Token: {access_token}")
print(f"Token length: {len(access_token)}")

# ทดสอบ decode
try:
    payload = jwt.decode(
        access_token, 
        settings.SECRET_KEY, 
        algorithms=[settings.ALGORITHM]
    )
    print(f"✅ Decode success!")
    print(f"Payload: {payload}")
except Exception as e:
    print(f"❌ Decode failed: {e}")