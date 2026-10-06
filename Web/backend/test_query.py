from database import get_db

db = get_db()

print("=== Testing Supabase Connection ===")

# ทดสอบ 1: Query users table
try:
    result = db.table("users").select("*").limit(1).execute()
    print("✅ Query users table: SUCCESS")
    print(f"   Data type: {type(result.data)}")
    print(f"   Data: {result.data}")
except Exception as e:
    print(f"❌ Query users table: FAILED")
    print(f"   Error: {e}")

# ทดสอบ 2: Query roles table
try:
    result = db.table("roles").select("*").execute()
    print("✅ Query roles table: SUCCESS")
    print(f"   Data: {result.data}")
except Exception as e:
    print(f"❌ Query roles table: FAILED")
    print(f"   Error: {e}")

print("=== Test Complete ===")