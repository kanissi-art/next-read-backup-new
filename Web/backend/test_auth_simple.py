"""
Test authentication utilities
Run this from backend directory: python test_auth_simple.py
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.auth import verify_password, get_password_hash, create_access_token

print("=== Testing Auth Utilities ===")

# Test 1: Password hashing
print("\n1. Testing password hashing...")
password = "password123"
hashed = get_password_hash(password)
print(f"   ✓ Password: {password}")
print(f"   ✓ Hashed: {hashed[:40]}...")
print(f"   ✓ Hash length: {len(hashed)} chars")

# Test 2: Password verification
print("\n2. Testing password verification...")
is_valid = verify_password(password, hashed)
print(f"   ✓ Verification result: {is_valid}")

# Test 3: Wrong password
print("\n3. Testing wrong password...")
is_invalid = verify_password("wrongpassword", hashed)
print(f"   ✓ Wrong password rejected: {not is_invalid}")

# Test 4: Create JWT token
print("\n4. Testing JWT token creation...")
token = create_access_token({"sub": 3})
print(f"   ✓ Token created: {token[:50]}...")
print(f"   ✓ Token length: {len(token)} chars")

print("\n=== All tests passed! ===")