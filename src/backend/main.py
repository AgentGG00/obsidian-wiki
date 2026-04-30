from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from pathlib import Path
from .config import VAULT_MAP, DEV_VAULT_PATH
from .comments import get_comments, init_db
from .parser import parse_page, get_visibility

app = FastAPI()
init_db()

app.mount("/static", StaticFiles(directory="src/frontend/static"), name="static")
templates = Jinja2Templates(directory="src/frontend/templates")

def get_vault_path(request: Request) -> Path:
    host = request.headers.get("host", "").split(":")[0]
    path = VAULT_MAP.get(host, DEV_VAULT_PATH)
    return Path(path)

class CommentIn(BaseModel):
    author_name: str
    content: str


@app.get("/")
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


@app.get("/{slug}")
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

@app.post("/comments/{slug}")
async def post_comment(request: Request, slug: str, comment: CommentIn):
    from .comments import get_connection
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

@app.exception_handler(404)
async def not_found(request: Request, exc: HTTPException):
    return templates.TemplateResponse(request=request, name="404.html", status_code=404)