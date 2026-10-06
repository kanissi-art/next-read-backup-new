import bcrypt

password = "password123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f"Hash for 'password123': {hashed.decode('utf-8')}")