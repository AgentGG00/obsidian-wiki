# Obsidian Wiki – projekt-stand.md

## Projektbeschreibung

Eine selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler können Lore, NPCs, Orte und andere Kampagneninhalte nachlesen. Der DM kontrolliert granular welche Inhalte öffentlich sichtbar, geschwärzt oder komplett versteckt sind. Inhalte werden in Obsidian verfasst und von Claude via MCP unterstützt ausgearbeitet.

## Tech-Stack

| Komponente | Technologie |
| --- | --- |
| Backend | Python 3 + FastAPI |
| Templates | Jinja2 |
| Markdown-Parsing | python-markdown + python-frontmatter + custom Callout-Parser |
| Deployment | Docker Compose |
| Webserver | Apache Reverse Proxy |
| Versionskontrolle | GitHub |

## MCP Server

| Service | Vault | Port |
| --- | --- | --- |
| `mcp-obsidian-horizon` | horizon-dnd | 3301 |
| `mcp-obsidian-isekai` | isekai-dnd | 3302 |
| `mcp-obsidian-otherworld-dnd` | Otherworld | 3303 |
| `mcp-obsidian-umschulung` | umschulung | 3304 |
| `mcp-obsidian-techprojekte` | techprojekte | 3305 |

## Admins

| Name | Vault-Zugriff |
| --- | --- |
| Niklas | `*` (alle Vaults) |
| Jana | `isekai-dnd` |

## Offene Entscheidungen

- [x] Name der dritten Kampagne

---

## Checklist

### Init

- [x] GitHub Repo anlegen
- [x] `.gitignore` anpassen
- [x] `.env.example` erstellen
- [x] Repo-Struktur finalisieren (`src/backend/routers/`, `src/db/`)
- [x] VDS mit Git verknüpfen

### Backend

- [x] `main.py` – FastAPI Grundstruktur
- [x] `config.py` – Domain → Vault-Ordner Mapping
- [x] `config.py` – VAULT_THEME_MAP + VAULT_ICON_MAP
- [x] `dependencies.py` – `get_vault_theme()`, `get_vault_icon()`
- [x] `parser.py` – Markdown + Frontmatter-Unterstützung
- [x] `parser.py` – Callout-Logik (`hidden`, `dm-only`, `picture`, `notes`)
- [x] `parser.py` – Inline-Hidden Syntax (`==text==` → Tintenklecks)
- [x] `parser.py` – TOC-Parsing (`_toc.yml`) + `flatten_toc()`
- [x] `routers/pages.py` – Routing auslagern aus `main.py`
- [x] `routers/pages.py` – `/api/toc` Endpunkt
- [x] `routers/pages.py` – `/api/page/{slug}` Endpunkt
- [x] `admin/auth.py` – Tailscale-IP-Whitelist aus `.env`
- [x] `admin/auth.py` – Login-Route `/admin/login`, SHA-256 Passwort-Prüfung, Session-Cookie (30 min)
- [x] `admin/auth.py` – Multi-Admin aus `.env` (Niklas: alle Vaults, Jana: `isekai-dnd`)
- [x] `admin/auth.py` – Vault-spezifische Fehlermeldung bei falschem Kampagnenzugriff

### Frontend

- [x] `base.html` – Book Layout Grundstruktur
- [x] `index.html` – TOC-Seite (Inhaltsverzeichnis mit Seitenzahlen)
- [x] `page.html` – Einzelseite (SSR-Fallback)
- [x] `404.html` – Fehlerseite mit Theme-Support
- [x] `datenschutz.html` – Statische Datenschutzseite (Route `/datenschutz`)
- [x] `icons.svg` – SVG Sprite (Sonne, Mond, Kampagnen-Icons, Pfeile)

### feat: Book Layout

- [x] `book.css` – Vollbild-Layout (`#book-root`, `#book-stage`, `#book-header`, `#book-footer`)
- [x] `book.css` – Header mit Back-Button, TOC-Toggle, Theme-Toggle
- [x] `book.css` – TOC-Dropdown (kollabierbare Kapitelstruktur, aktive Seite markiert)
- [x] `book.css` – Seitenanimationen (slide-in/out links/rechts)
- [x] `book.css` – Footer mit Seitenzahl und Nav-Pfeilen
- [x] `book.css` – TOC-Seite (Inhaltsverzeichnis mit Punktlinie + Seitenzahl)
- [x] `book.css` – `--header-height` als CSS Custom Property auf `:root`
- [x] `book.css` – Responsive (Mobile 480px)
- [x] `book.js` – `BookEngine` Klasse (Navigation, TOC, Animationen)
- [x] `book.js` – Client-Side Navigation via `/api/page/{slug}`
- [x] `book.js` – Verlaufsnavigation (Back-Button mit History-Stack)
- [x] `book.js` – Multi-Click Navigation (1× = Seite, 2× = Unterkapitel, 3× = Kapitel)
- [x] `book.js` – Keyboard-Navigation (Pfeiltasten, selbe Multi-Click-Logik)
- [x] `book.js` – Touch/Swipe-Navigation (1–3 Finger = selbe Logik)
- [x] `book.js` – Theme-Umschaltung (Light/Dark, System-Default, Flash-Prevention)

### feat: Design

- [x] `style.css` – Komplett neu, schlicht mit Fantasy-Anklang, keine KI-Ästhetik
- [x] `style.css` – Dark/Light Theme, CSS Custom Properties auf `html`
- [x] `style.css` – System-Preference als Default beim ersten Besuch
- [x] `style.css` – Responsive Breakpoints (Mobile, Tablet, Desktop)
- [x] `style.css` – Kampagnen-spezifische Farbthemen (horizon, isekai, otherworld)
- [x] `style.css` – Tintenklecks-Callout (block + inline)
- [x] `style.css` – Sidebar-Callouts (`picture`, `notes`)

### feat: Cookie & DSGVO

- [x] Cookie-Banner beim ersten Besuch
- [x] Kategorie 1: Theme-Präferenz (localStorage)
- [x] Ablehnen → kein Cookie gesetzt, Theme läuft session-basiert
- [x] Datenschutzseite `/datenschutz`

### feat: MCP Server

- [x] Node.js 20 auf VDS installieren
- [x] `@bitbonsai/mcpvault` installieren
- [x] `mcp-proxy` (Python) installieren
- [x] 5 systemd Services einrichten (Ports 3301–3305)
- [x] UFW Regeln auf `tailscale0` (Ports 3301–3305)
- [x] Dedizierter SSH-Key für Claude Desktop
- [x] Claude Desktop Config einrichten
- [x] Verbindung getestet und funktioniert

### Fix

- [x] `parser.py` – Inline-Hidden Replacement per Lambda korrigiert (Zeichenanzahl stimmte nicht)
- [x] `routers/pages.py` – `author_token`-Cookie auf `JSONResponse` gesetzt statt auf `response`-Parameter
- [x] `book.js` / `book.css` – Issue #13: TOC-Dropdown Positionierung (`overflow: hidden` Clipping durch `#book-root`, globaler `nav`-Selector Reset, `--header-height` als zoom-invariante Custom Property)

### Install

- [x] `requirements.txt` – python-dotenv, python-multipart ergänzt
- [x] Abhängigkeiten auf VDS installieren

### Test / Review

- [ ] Parser-Logik testen (Frontmatter, Callouts, Inline-Hidden)
- [ ] Multi-Vault-Routing testen (alle Domains)
- [ ] Book Layout testen (Navigation, Animationen, TOC, Zoom-Verhalten)

### Deployment

- [x] Docker Compose auf VDS einrichten
- [x] Apache vHosts für alle Domains konfigurieren
- [x] Certbot SSL einrichten
- [x] Cloudflare DNS A-Records setzen