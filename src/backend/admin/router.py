import os
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from ..dependencies import templates, get_vault_path, get_vault_theme, get_vault_icon
from ..comments import get_connection
from .auth import is_tailscale, verify_admin, verify_session

router = APIRouter(prefix="/admin")


class LoginIn(BaseModel):
    password: str
    name: str


@router.get("/login")
async def login_page(request: Request):
    if not is_tailscale(request):
        return JSONResponse({"error": "Nicht erlaubt"}, status_code=403)
    return templates.TemplateResponse(request=request, name="admin/login.html", context={
        "vault_name": get_vault_theme(get_vault_path(request).name),
        "vault_icon": get_vault_icon(get_vault_path(request).name),
        "campaign_name": get_vault_path(request).name,
        "admins": [os.getenv(f"ADMIN_{i}_NAME") for i in range(1, 10) if os.getenv(f"ADMIN_{i}_NAME")]
    })


@router.post("/login")
async def login(request: Request, credentials: LoginIn):
    if not is_tailscale(request):
        return JSONResponse({"error": "Nicht erlaubt"}, status_code=403)

    vault = get_vault_path(request).name
    admin, error = verify_admin(credentials.password, vault, credentials.name)

    if not admin:
        msg = "Kein Zugriff auf diese Kampagne." if error == "wrong_vault" else "Ungültiges Passwort."
        return JSONResponse({"error": msg}, status_code=401)

    response = RedirectResponse(url="/admin", status_code=302)
    response.set_cookie(
        "admin_session",
        os.getenv("ADMIN_SESSION_SECRET"),
        httponly=True,
        samesite="strict",
        max_age=60 * 30
    )
    response.set_cookie("admin_vault", vault, httponly=True, samesite="strict")
    return response


@router.get("")
async def dashboard(request: Request):
    if not is_tailscale(request) or not verify_session(request):
        return RedirectResponse(url="/admin/login")

    vault = request.cookies.get("admin_vault")
    conn = get_connection()
    comments = conn.execute(
        "SELECT * FROM comments WHERE vault = ? ORDER BY created_at DESC",
        (vault,)
    ).fetchall() if vault != "*" else conn.execute(
        "SELECT * FROM comments ORDER BY created_at DESC"
    ).fetchall()
    conn.close()

    return templates.TemplateResponse(request=request, name="admin/dashboard.html", context={
        "comments": [dict(c) for c in comments],
        "vault": vault,
        "vault_name": get_vault_theme(get_vault_path(request).name),
        "vault_icon": get_vault_icon(get_vault_path(request).name),
        "campaign_name": get_vault_path(request).name,
    })


@router.delete("/comments/{comment_id}")
async def admin_delete_comment(request: Request, comment_id: int):
    if not is_tailscale(request) or not verify_session(request):
        return JSONResponse({"error": "Nicht erlaubt"}, status_code=403)

    conn = get_connection()
    conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
    conn.commit()
    conn.close()

    return JSONResponse({"ok": True})