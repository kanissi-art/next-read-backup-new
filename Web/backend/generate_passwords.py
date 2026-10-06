import bcrypt

# Password ที่ต้องการ
password = "password123"

# Hash password ด้วย bcrypt
password_bytes = password.encode('utf-8')
hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())

print(f"Password: {password}")
print(f"Hashed: {hashed.decode('utf-8')}")
print(f"Hash length: {len(hashed)} bytes")

# ทดสอบ verify
if bcrypt.checkpw(password_bytes, hashed):
    print("✅ Password verification successful!")
else:
    print("❌ Password verification failed!")