# Obsidian Wiki – projekt-stand.md

## Projektbeschreibung

Eine selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler können Lore, NPCs, Orte und andere Kampagneninhalte nachlesen. Der DM kontrolliert granular welche Inhalte öffentlich sichtbar, geschwärzt oder komplett versteckt sind. Inhalte werden in Obsidian verfasst und von Claude via MCP unterstützt ausgearbeitet.

## Zielgruppe & Nutzen

- **DM (Niklas):** Inhalte in Obsidian schreiben, Sichtbarkeit per Frontmatter und Callouts steuern, Claude als Schreibassistent nutzen
- **Spieler:** Kampagnen-Wiki im Browser lesen, anonym kommentieren

## Tech-Stack Entscheidung

| Komponente | Technologie | Begründung |
|---|---|---|
| Backend | Python 3 + FastAPI | Leichtgewichtig, gut für serverseitiges Rendering, passt zu bestehendem VDS-Stack |
| Templates | Jinja2 | Serverseitiges HTML-Rendering, kein Build-Prozess, für Wiki ideal |
| Datenbank | SQLite | Nur für Kommentare, keine komplexen Queries, kein extra Datenbankserver |
| Markdown-Parsing | python-markdown + custom Parser | Frontmatter via python-frontmatter, Callout-Logik selbst gebaut |
| Webserver | Apache Reverse Proxy | Bereits vorhanden auf VDS, Host-Header-Routing auf FastAPI |
| Prozessmanager | systemd | Kein Docker für diese App, direkt auf VDS |
| Versionskontrolle | GitHub (1 Repo) | Ein Repo für alle drei Wikis |

## Architekturübersicht

```
Browser (Spieler)
  └── Cloudflare (Proxy)
        └── Apache (Reverse Proxy, Host-Header-Routing)
              └── FastAPI (eine Instanz, Port z.B. 8090)
                    ├── config.py: Domain → Vault-Ordner Mapping
                    ├── parser.py: Markdown + Frontmatter + Callouts
                    ├── comments.py: SQLite Kommentare
                    └── /data/nas/[vault]/ (Obsidian Vault Dateien)
```

### Host-Header-Routing

Apache liest den `Host` Header und leitet alle drei Domains an dieselbe FastAPI-Instanz weiter. FastAPI mappt die Domain auf den richtigen Vault-Ordner:

```
horizon.framenode.net   → /data/nas/horizon-dnd/
isekai.framenode.net    → /data/nas/isekai-dnd/
xxxx.framenode.net      → /data/nas/neue-langzeitkampagne/
```

## Sichtbarkeits-System

### Ebene 1: Frontmatter (ganze Seite)

```yaml
---
visibility: public     # Spieler sehen die Seite normal
visibility: dm-only    # Seite existiert nicht im Wiki für Spieler
---
```

Kein Frontmatter = standardmäßig `public`.

### Ebene 2: Obsidian Callouts (abschnittsweise)

```markdown
> [!hidden]
> Dieser Text wird als schwarzer Balken dargestellt

> [!dm-only]
> Dieser Text ist für Spieler komplett unsichtbar
```

Normaler Text außerhalb von Callouts ist immer öffentlich.

## Kommentarsystem

- Anonym, kein Login
- SQLite Tabelle: `comments(id, vault, page_slug, author_name, content, created_at)`
- Kein Spam-Schutz in Phase 1 (da Spielerkreis bekannt und klein)

## Projektstruktur (Repo)

```
/var/www/dnd-wiki/
  ├── main.py
  ├── config.py
  ├── parser.py
  ├── comments.py
  ├── database.db
  ├── requirements.txt
  ├── templates/
  │   ├── base.html
  │   ├── page.html
  │   ├── index.html
  │   └── 404.html
  └── static/
      ├── style.css
      └── script.js
```

## Deployment

- Pfad auf VDS: `/var/www/dnd-wiki/`
- systemd Service: `dnd-wiki.service`
- FastAPI läuft auf `127.0.0.1:8090`
- Apache vHosts: `horizon.framenode.net`, `isekai.framenode.net`, `xxxx.framenode.net`
- Certbot SSL für alle drei Domains

## MCP Server ✅ FERTIG

**Stack:**
- `@bitbonsai/mcpvault` – liest Vault-Dateien direkt, kein Obsidian-Plugin nötig
- `mcp-proxy` (Python) – bridged mcpvault stdio → Streamable HTTP
- `mcp-remote` (npm) – lokaler Proxy auf Windows für Claude Desktop

**5 systemd Services auf VDS:**
| Service | Vault | Port |
|---|---|---|
| `mcp-obsidian-horizon` | horizon-dnd | 3301 |
| `mcp-obsidian-isekai` | isekai-dnd | 3302 |
| `mcp-obsidian-neuekampagne` | neue-langzeitkampagne | 3303 |
| `mcp-obsidian-umschulung` | umschulung | 3304 |
| `mcp-obsidian-techprojekte` | techprojekte | 3305 |

**UFW:** Ports 3301–3305 nur auf `tailscale0` erlaubt

**Tailscale Hostname:** `vmd189134-1.tail61384f.ts.net`

**Claude Desktop Config** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "obsidian-horizon": {
      "command": "npx",
      "args": ["mcp-remote", "http://vmd189134-1.tail61384f.ts.net:3301/mcp", "--allow-http"]
    }
    // ... analog für alle 5 Vaults (Ports 3301-3305)
  }
}
```

**Dedizierter SSH-Key für MCP:** `~/.ssh/id_ed25519_claude_mcp` (nicht mehr aktiv genutzt, Key in authorized_keys vorhanden)

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (aktuell: XXXX / `xxxx.framenode.net`)
- [ ] Design/Theme der Wiki-Oberfläche (dark/light, Fantasy-Stil?)
- [ ] Sollen Kommentare moderierbar sein (DM kann löschen)?
