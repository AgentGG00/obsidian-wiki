from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from ..dependencies import templates, get_vault_path, get_vault_theme, get_vault_icon
from ..parser import parse_page, get_visibility, parse_toc, flatten_toc

router = APIRouter()


@router.get("/")
async def index(request: Request):
    vault_path = get_vault_path(request)
    chapters = parse_toc(str(vault_path))
    flat = flatten_toc(chapters, str(vault_path))
    slug_to_num = {p["slug"]: i + 1 for i, p in enumerate(flat)}

    return templates.TemplateResponse(request=request, name="index.html", context={
        "chapters": chapters,
        "flat": flat,
        "slug_to_num": slug_to_num,
        "vault_name": get_vault_theme(vault_path.name),
        "campaign_name": vault_path.name,
        "vault_icon": get_vault_icon(vault_path.name),
    })


@router.get("/datenschutz")
async def datenschutz(request: Request):
    vault = get_vault_path(request)
    return templates.TemplateResponse(request=request, name="datenschutz.html", context={
        "vault_name": get_vault_theme(vault.name),
        "vault_icon": get_vault_icon(vault.name),
        "campaign_name": vault.name,
    })


@router.get("/api/toc")
async def api_toc(request: Request):
    vault_path = get_vault_path(request)
    chapters = parse_toc(str(vault_path))
    flat = flatten_toc(chapters, str(vault_path))
    return JSONResponse({"chapters": chapters, "flat": flat})


@router.get("/api/page/{slug}")
async def api_page(request: Request, slug: str):
    vault = get_vault_path(request)
    filepath = vault / f"{slug}.md"
    if not filepath.exists():
        filepath = next(vault.rglob(f"{slug}.md"), None)
    if not filepath or not filepath.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    page_data = parse_page(str(filepath))
    if page_data["visibility"] == "dm-only":
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse({
        "slug": slug,
        "title": page_data["title"],
        "content": page_data["content"],
    })


@router.get("/{slug}")
async def page(request: Request, slug: str):
    vault = get_vault_path(request)
    filepath = vault / f"{slug}.md"
    if not filepath.exists():
        filepath = next(vault.rglob(f"{slug}.md"), None)
    if not filepath or not filepath.exists():
        return templates.TemplateResponse(request=request, name="404.html", status_code=404, context={
            "vault_name": get_vault_theme(vault.name),
            "vault_icon": get_vault_icon(vault.name),
            "campaign_name": vault.name,
        })
    page_data = parse_page(str(filepath))
    chapters = parse_toc(str(vault))
    flat = flatten_toc(chapters, str(vault))
    slugs = [p["slug"] for p in flat]
    current_index = slugs.index(slug) if slug in slugs else -1

    return templates.TemplateResponse(request=request, name="page.html", context={
        "title": page_data["title"],
        "content": page_data["content"],
        "vault_name": get_vault_theme(vault.name),
        "campaign_name": vault.name,
        "vault_icon": get_vault_icon(vault.name),
        "page_num": current_index + 1 if current_index >= 0 else 0,
        "total_pages": len(flat),
        "slug": slug,
    })