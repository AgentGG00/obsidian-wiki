# Obsidian Wiki – projekt-stand.md

## Projektbeschreibung

Eine selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler können Lore, NPCs, Orte und andere Kampagneninhalte nachlesen. Der DM kontrolliert granular welche Inhalte öffentlich sichtbar, geschwärzt oder komplett versteckt sind. Inhalte werden in Obsidian verfasst und von Claude via MCP unterstützt ausgearbeitet.

## Tech-Stack

| Komponente | Technologie |
| --- | --- |
| Backend | Python 3 + FastAPI |
| Templates | Jinja2 |
| Datenbank | SQLite (nur Kommentare) |
| Markdown-Parsing | python-markdown + python-frontmatter + custom Callout-Parser |
| Webserver | Apache Reverse Proxy |
| Prozessmanager | systemd |
| Versionskontrolle | GitHub |

## MCP Server

| Service | Vault | Port |
| --- | --- | --- |
| `mcp-obsidian-horizon` | horizon-dnd | 3301 |
| `mcp-obsidian-isekai` | isekai-dnd | 3302 |
| `mcp-obsidian-neuekampagne` | neue-langzeitkampagne | 3303 |
| `mcp-obsidian-umschulung` | umschulung | 3304 |
| `mcp-obsidian-techprojekte` | techprojekte | 3305 |

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (Domain: aktuell offen)
- [ ] Design/Theme der Wiki-Oberfläche (dark Fantasy-Stil geplant)
- [ ] Kommentare moderierbar durch DM (Phase 2)

---

## Checklist

### Init

- [x] GitHub Repo anlegen
- [ ] Repo-Struktur anlegen (`src/backend/`, `src/frontend/`, `src/db/`, `docs/`)
- [ ] `.gitignore` anpassen (`src/db/`, `.env`)
- [ ] `.env.example` erstellen
- [ ] VDS mit Git verknüpfen

### Backend

- [ ] `main.py` – FastAPI Grundstruktur
- [ ] `config.py` – Domain → Vault-Ordner Mapping
- [ ] `parser.py` – Markdown + Frontmatter-Unterstützung
- [ ] `parser.py` – Callout-Logik (`hidden`, `dm-only`)
- [ ] `routers/pages.py` – Routing für Index, Einzelseite, 404
- [ ] `comments.py` – SQLite Modell + Endpunkte

### Frontend

- [ ] `base.html` – Grundlayout
- [ ] `index.html` – Übersichtsseite
- [ ] `page.html` – Einzelseite mit Callout-Rendering
- [ ] Kommentarformular + Kommentarliste
- [ ] `style.css` – Fantasy-Theme, responsive
- [ ] `script.js` – Kommentar absenden

### feat: MCP Server

- [x] Node.js 20 auf VDS installieren
- [x] `@bitbonsai/mcpvault` installieren
- [x] `mcp-proxy` (Python) installieren
- [x] 5 systemd Services einrichten (Ports 3301–3305)
- [x] UFW Regeln auf `tailscale0` (Ports 3301–3305)
- [x] Dedizierter SSH-Key für Claude Desktop
- [x] Claude Desktop Config einrichten
- [x] Verbindung getestet und funktioniert

### Install

- [ ] `requirements.txt` erstellen
- [ ] Abhängigkeiten auf VDS installieren

### Test / Review

- [ ] Parser-Logik testen (Frontmatter, Callouts)
- [ ] Multi-Vault-Routing testen (alle drei Domains)
- [ ] Kommentarsystem testen

### Deployment

- [ ] systemd Service `obsidian-wiki.service` einrichten
- [ ] Apache vHosts für alle drei Domains konfigurieren
- [ ] Certbot SSL einrichten
- [ ] Cloudflare DNS A-Records setzen
