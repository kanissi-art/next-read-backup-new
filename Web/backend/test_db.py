from database import get_db

db = get_db()

# ทดสอบ query users
result = db.table("users").select("*").limit(1).execute()
print("Result type:", type(result))
print("Result.data type:", type(result.data))
print("Result.data:", result.data)