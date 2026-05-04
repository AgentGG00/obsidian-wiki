import os
import hashlib
from fastapi import Request

TAILSCALE_IPS = os.getenv("ADMIN_TAILSCALE_IPS", "").split(",")

def is_tailscale(request: Request) -> bool:
    client_ip = request.client.host
    return client_ip in TAILSCALE_IPS

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_admins() -> list:
    admins = []
    i = 1
    while True:
        name = os.getenv(f"ADMIN_{i}_NAME")
        if not name:
            break
        admins.append({
            "name": name,
            "password_hash": os.getenv(f"ADMIN_{i}_PASSWORD_HASH"),
            "vault": os.getenv(f"ADMIN_{i}_VAULT"),
        })
        i += 1
    return admins

def verify_admin(password: str, vault: str, name: str = None) -> tuple[dict | None, str | None]:
    hashed = hash_password(password)
    for admin in get_admins():
        if admin["name"] != name:
            continue
        if admin["password_hash"] != hashed:
            return None, "wrong_password"
        if admin["vault"] != "*" and admin["vault"] != vault:
            return None, "wrong_vault"
        return admin, None
    return None, "wrong_password"

def verify_session(request: Request) -> bool:
    return request.cookies.get("admin_session") == os.getenv("ADMIN_SESSION_SECRET")