import os
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from ..dependencies import templates, get_vault_path
from ..comments import get_connection
from .auth import is_tailscale, verify_admin, verify_session, hash_password

router = APIRouter(prefix="/admin")


class LoginIn(BaseModel):
    password: str


@router.get("/login")
async def login_page(request: Request):
    if not is_tailscale(request):
        return JSONResponse({"error": "Nicht erlaubt"}, status_code=403)
    return templates.TemplateResponse(request=request, name="admin/login.html", context={})


@router.post("/login")
async def login(request: Request, credentials: LoginIn):
    if not is_tailscale(request):
        return JSONResponse({"error": "Nicht erlaubt"}, status_code=403)

    vault = get_vault_path(request).name
    admin = verify_admin(credentials.password, vault)

    if not admin:
        return JSONResponse({"error": "Ungültige Zugangsdaten"}, status_code=401)

    response = RedirectResponse(url="/admin", status_code=302)
    response.set_cookie(
        "admin_session",
        os.getenv("ADMIN_SESSION_SECRET"),
        httponly=True,
        samesite="strict",
        max_age=60 * 60 * 8
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
        "vault": vault
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