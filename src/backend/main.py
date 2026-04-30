from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import HTTPException
from .dependencies import templates
from .comments import init_db
from .routers import pages

app = FastAPI()
init_db()

app.mount("/static", StaticFiles(directory="src/frontend/static"), name="static")
app.include_router(pages.router)

@app.exception_handler(404)
async def not_found(request: Request, exc: HTTPException):
    return templates.TemplateResponse(request=request, name="404.html", status_code=404)