# Obsidian Wiki – projekt-stand.md

## Projektbeschreibung

Eine selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler können Lore, NPCs, Orte und andere Kampagneninhalte nachlesen. Der DM kontrolliert granular welche Inhalte öffentlich sichtbar, geschwärzt oder komplett versteckt sind. Inhalte werden in Obsidian verfasst und von Claude via MCP unterstützt ausgearbeitet.

## Zielgruppe & Nutzen

- **DM:** Inhalte in Obsidian schreiben, Sichtbarkeit per Frontmatter und Callouts steuern, Claude als Schreibassistent nutzen
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
| Versionskontrolle | GitHub (1 Repo, framenode Organisation) | Ein Repo für alle drei Wikis |

## Architekturübersicht

```
Browser (Spieler)
  └── Cloudflare (Proxy)
        └── Apache (Reverse Proxy, Host-Header-Routing)
              └── FastAPI (eine Instanz, Port z.B. 8090)
                    ├── config.py: Domain → Vault-Ordner Mapping
                    ├── parser.py: Markdown + Frontmatter + Callouts
                    ├── comments.py: SQLite Kommentare
                    └── /data/nas/vaults/[vault]/ (Obsidian Vault Dateien)
```

### Host-Header-Routing

Apache liest den `Host` Header und leitet alle drei Domains an dieselbe FastAPI-Instanz weiter. FastAPI mappt die Domain auf den richtigen Vault-Ordner:

```
horizon.framenode.net   → /data/nas/vaults/horizon-dnd/
isekai.framenode.net    → /data/nas/vaults/isekai-dnd/
xxxx.framenode.net      → /data/nas/vaults/neue-langzeitkampagne/
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
/var/www/obsidian-wiki/
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

- Pfad auf VDS: `/var/www/obsidian-wiki/`
- systemd Service: `obsidian-wiki.service`
- FastAPI läuft auf `127.0.0.1:8090`
- Apache vHosts: `horizon.framenode.net`, `isekai.framenode.net`, `xxxx.framenode.net`
- Certbot SSL für alle drei Domains
- GitHub Actions Deploy bei Release (`published`)

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

## GitHub Organisation

- Organisation: `framenode` (personal account)
- Organisation Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`
- Deployment User auf VDS: `github` (minimale Rechte, nur `sudo systemctl restart *`)

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (aktuell: XXXX / `xxxx.framenode.net`)
- [ ] Sollen Kommentare moderierbar sein (DM kann löschen)?

## Checkliste

### Setup
- [x] GitHub Repo anlegen (obsidian-wiki, framenode Organisation, dev Branch)
- [ ] VDS mit Git verknüpfen + Projektstruktur initialisieren

### MCP Server
- [x] Node.js 20 auf VDS installieren
- [x] `@bitbonsai/mcpvault` installieren
- [x] `mcp-proxy` (Python) installieren
- [x] 5 systemd Services einrichten (Ports 3301–3305)
- [x] UFW Regeln auf tailscale0
- [x] Dedizierter SSH-Key für Claude Desktop
- [x] Claude Desktop Config einrichten
- [x] Verbindung getestet und funktioniert

### Wiki-Webapp Backend
- [x] FastAPI Grundstruktur + config.py Domain-Mapping
- [x] Markdown Parser mit Frontmatter-Unterstützung
- [x] Callout-Parser (hidden, dm-only Logik)
- [x] Routing – Index, Einzelseite, 404
- [x] SQLite Kommentar-Modell + Endpunkte
- [x] dm-only Filter im Index (Seiten nicht sichtbar für Spieler)

### Wiki-Webapp Frontend
- [x] base.html Grundlayout
- [x] index.html Übersichtsseite
- [x] page.html Einzelseite mit Callout-Rendering
- [x] Kommentarformular + Kommentarliste
- [x] style.css (Fantasy-Theme, dark/light/system, responsive)
- [x] script.js (Theme Cycle, Kommentar absenden)

### Deployment
- [x] GitHub Actions deploy.yml (bei Release)
- [x] Organisation Secrets angelegt
- [x] Deployment User `github` auf VDS eingerichtet
- [ ] install.yml – Erstinstallation via GitHub Action
- [ ] systemd Service obsidian-wiki.service
- [ ] Apache vHosts für alle drei Domains
- [ ] Certbot SSL
- [ ] Cloudflare DNS A-Records