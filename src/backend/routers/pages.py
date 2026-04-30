from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ..dependencies import templates, get_vault_path
from ..comments import get_comments, get_connection
from ..parser import parse_page, get_visibility

router = APIRouter()


class CommentIn(BaseModel):
    author_name: str
    content: str


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
async def post_comment(request: Request, slug: str, comment: CommentIn):
    vault = get_vault_path(request)
    vault_name = vault.name

    conn = get_connection()
    conn.execute(
        "INSERT INTO comments (vault, page_slug, author_name, content) VALUES (?, ?, ?, ?)",
        (vault_name, slug, comment.author_name, comment.content)
    )
    conn.commit()
    conn.close()

    return JSONResponse({"ok": True})