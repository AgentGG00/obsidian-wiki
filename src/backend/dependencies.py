from fastapi import Request
from fastapi.templating import Jinja2Templates
from pathlib import Path
from .config import VAULT_MAP, DEV_VAULT_PATH, VAULT_THEME_MAP, VAULT_ICON_MAP

templates = Jinja2Templates(directory="src/frontend/templates")

def get_vault_path(request: Request) -> Path:
    host = request.headers.get("host", "").split(":")[0]
    path = VAULT_MAP.get(host, DEV_VAULT_PATH)
    return Path(path)

def get_vault_theme(vault_name: str) -> str:
    return VAULT_THEME_MAP.get(vault_name, "vault-horizon-dnd")

def get_vault_icon(vault_name: str) -> str:
    return VAULT_ICON_MAP.get(vault_name, "horizon")