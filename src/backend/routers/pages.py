from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from httpx import request
from pydantic import BaseModel
from ..dependencies import templates, get_vault_path, get_vault_theme, get_vault_icon
from ..comments import get_comments, add_comment, edit_comment, delete_comment, generate_author_token
from ..parser import parse_page, get_visibility

router = APIRouter()


class CommentIn(BaseModel):
    author_name: str
    content: str
    parent_id: int | None = None

def build_comment_tree(comments: list) -> list:
    by_id = {c["id"]: {**c, "replies": []} for c in comments}
    roots = []
    for c in comments:
        if c["parent_id"] is None:
            roots.append(by_id[c["id"]])
        elif c["parent_id"] in by_id:
            by_id[c["parent_id"]]["replies"].append(by_id[c["id"]])
    return roots

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

    return templates.TemplateResponse(request=request, name="index.html", context={
        "pages": pages,
        "vault_name": get_vault_theme(vault_path.name),
        "campaign_name": vault_path.name,
        "vault_icon": get_vault_icon(vault_path.name),
    })


@router.get("/{slug}")
async def page(request: Request, slug: str):
    vault = get_vault_path(request)
    filepath = vault / f"{slug}.md"

    if not filepath.exists():
        return templates.TemplateResponse(request=request, name="404.html", status_code=404, context={
            "vault_name": get_vault_theme(vault.name),
            "vault_icon": get_vault_icon(vault.name),
            "campaign_name": vault.name,
        })

    page_data = parse_page(str(filepath))
    raw_comments = get_comments(vault.name, slug)
    author_token = request.cookies.get("author_token")
    owned_ids = [c["id"] for c in raw_comments if c.get("author_token") == author_token] if author_token else []

    return templates.TemplateResponse(request=request, name="page.html", context={
        "title": slug.replace("-", " ").title(),
        "content": page_data["content"],
        "comments": build_comment_tree(raw_comments),
        "owned_ids": owned_ids,
        "vault_name": get_vault_theme(vault.name),
        "campaign_name": vault.name,
        "vault_icon": get_vault_icon(vault.name),
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
    json_response = JSONResponse({"ok": True, "comment": new_comment})

    if cookie_consent == "true":
        json_response.set_cookie("author_token", author_token, max_age=60*60*24*365, httponly=True, samesite="lax")

    return json_response


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