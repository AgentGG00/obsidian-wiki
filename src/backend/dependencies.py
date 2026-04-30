from fastapi import Request
from fastapi.templating import Jinja2Templates
from pathlib import Path
from .config import VAULT_MAP, DEV_VAULT_PATH

templates = Jinja2Templates(directory="src/frontend/templates")

def get_vault_path(request: Request) -> Path:
    host = request.headers.get("host", "").split(":")[0]
    path = VAULT_MAP.get(host, DEV_VAULT_PATH)
    return Path(path)