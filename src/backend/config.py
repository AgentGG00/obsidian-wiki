DEV_VAULT_PATH: str = "./tests/dev-vaults/horizon-dnd"

VAULT_MAP: dict[str, str] = {
    "horizon.framenode.net": "/data/nas/vaults/horizon-dnd",
    "isekai.framenode.net": "/data/nas/vaults/isekai-dnd",
    "xxxx.framenode.net": "/data/nas/vaults/neue-langzeitkampagne",
}

VAULT_THEME_MAP: dict[str, str] = {
    "horizon-dnd":           "vault-horizon-dnd",
    "isekai-dnd":            "vault-isekai-dnd",
    "neue-langzeitkampagne": "vault-neue-langzeitkampagne",
}

VAULT_ICON_MAP: dict[str, str] = {
    "horizon-dnd":           "horizon",
    "isekai-dnd":            "isekai",
    "neue-langzeitkampagne": "neu",
}