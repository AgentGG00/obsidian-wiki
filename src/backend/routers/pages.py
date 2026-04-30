from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ..dependencies import templates, get_vault_path
from ..comments import get_comments, add_comment, edit_comment, delete_comment, generate_author_token
from ..parser import parse_page, get_visibility

router = APIRouter()


class CommentIn(BaseModel):
    author_name: str
    content: str
    parent_id: int | None = None


@router.get("/")
async def index(request: Request):
    vault_path = get_vault_path(request)
    pages = []

    for file in vault_path.glob("*.md"):
        if get_visibility(str(file)) == "dm-only":
            continue
        pages.append({
            "slug": file.stem,
            "title": file.stem.replace("-", " ").title()
        })

    return templates.TemplateResponse(request=request, name="index.html", context={"pages": pages})


@router.get("/{slug}")
async def page(request: Request, slug: str):
    vault = get_vault_path(request)
    filepath = vault / f"{slug}.md"

    if not filepath.exists():
        return templates.TemplateResponse(request=request, name="404.html", status_code=404)

    page_data = parse_page(str(filepath))

    return templates.TemplateResponse(request=request, name="page.html", context={
        "title": slug.replace("-", " ").title(),
        "content": page_data["content"],
        "comments": get_comments(vault.name, slug)
    })


@router.post("/comments/{slug}")
async def post_comment(request: Request, slug: str, comment: CommentIn, response: Response):
    vault = get_vault_path(request)
    vault_name = vault.name

    author_token = request.cookies.get("author_token") or generate_author_token()
    ip = request.client.host

    new_comment = add_comment(
        vault=vault_name,
        page_slug=slug,
        author_name=comment.author_name,
        content=comment.content,
        ip=ip,
        author_token=author_token,
        parent_id=comment.parent_id
    )

    cookie_consent = request.cookies.get("cookie_consent_k2")
    if cookie_consent == "true":
        response.set_cookie("author_token", author_token, max_age=60*60*24*365, httponly=True, samesite="lax")

    return JSONResponse({"ok": True, "comment": new_comment})

@router.patch("/comments/{comment_id}")
async def update_comment(request: Request, comment_id: int, comment: CommentIn):
    author_token = request.cookies.get("author_token")
    if not author_token:
        return JSONResponse({"ok": False, "error": "Kein Autoren-Token"}, status_code=403)

    success = edit_comment(comment_id, comment.content, author_token)
    if not success:
        return JSONResponse({"ok": False, "error": "Nicht autorisiert"}, status_code=403)

    return JSONResponse({"ok": True})


@router.delete("/comments/{comment_id}")
async def remove_comment(request: Request, comment_id: int):
    author_token = request.cookies.get("author_token")
    if not author_token:
        return JSONResponse({"ok": False, "error": "Kein Autoren-Token"}, status_code=403)

    success = delete_comment(comment_id, author_token)
    if not success:
        return JSONResponse({"ok": False, "error": "Nicht autorisiert"}, status_code=403)

    return JSONResponse({"ok": True})