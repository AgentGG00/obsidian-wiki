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

## Admins

| Name | Vault-Zugriff |
| --- | --- |
| Niklas | `*` (alle Vaults) |
| Jana | `isekai-dnd` |

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (Domain: aktuell offen)

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
- [x] `parser.py` – Markdown + Frontmatter-Unterstützung
- [x] `parser.py` – Callout-Logik (`hidden`, `dm-only`)
- [x] `parser.py` – Inline-Hidden Syntax (`==text==` → Tintenklecks)
- [x] `comments.py` – SQLite Modell + Basis-Endpunkte
- [x] `routers/pages.py` – Routing auslagern aus `main.py`
- [x] `comments.py` – Threading (max. 5 Ebenen, `parent_id`-Spalte)
- [x] `comments.py` – IP-Hashing (SHA-256, vor Speicherung)
- [x] `comments.py` – Autoren-Token (zufälliger UUID, mit Kommentar gespeichert)
- [x] `comments.py` – Bearbeiten/Löschen per Autoren-Token (nur wenn Kategorie-2-Cookie gesetzt)
- [x] `admin/auth.py` – Tailscale-IP-Whitelist aus `.env`
- [x] `admin/auth.py` – Login-Route `/admin/login`, SHA-256 Passwort-Prüfung, Session-Cookie (30 min)
- [x] `admin/auth.py` – Multi-Admin aus `.env` (Niklas: alle Vaults, Jana: `isekai-dnd`)
- [x] `admin/auth.py` – Vault-spezifische Fehlermeldung bei falschem Kampagnenzugriff
- [x] `admin/router.py` – Kommentare einsehen, bearbeiten, löschen (vault-gefiltert)
- [x] `config.py` – VAULT_THEME_MAP + VAULT_ICON_MAP
- [x] `dependencies.py` – get_vault_theme(), get_vault_icon()

### Frontend

- [x] `base.html` – Grundlayout
- [x] `index.html` – Übersichtsseite
- [x] `page.html` – Einzelseite mit Callout-Rendering + Threading-Struktur
- [x] `404.html` – Fehlerseite mit Theme-Support
- [x] `admin/login.html` – Admin Login mit Name-Dropdown
- [x] `admin/dashboard.html` – Kommentarverwaltung
- [x] `icons.svg` – SVG Sprite (Sonne, Mond, Kampagnen-Icons)
- [x] `cookie-banner.html` – DSGVO-konformer Banner, Opt-in pro Kategorie
- [ ] Kommentarformular – Name vorausfüllen (Kategorie-2-Cookie)
- [ ] Kommentarformular – Felder leeren nach Absenden
- [ ] Kommentarformular – Threading-UI (Antworten, max. 5 Ebenen)
- [ ] Kommentare – Bearbeiten/Löschen-Button (nur wenn Autoren-Token im Cookie)
- [ ] `datenschutz.html` – Statische Datenschutzseite (Route `/datenschutz`)

### feat: Design

- [x] `style.css` – Komplett neu, schlicht mit Fantasy-Anklang, keine KI-Ästhetik
- [x] `style.css` – Dark/Light Theme, CSS Custom Properties auf `html`
- [x] `style.css` – System-Preference als Default beim ersten Besuch
- [x] `style.css` – Responsive Breakpoints (Mobile, Tablet, Desktop)
- [x] `style.css` – Viewport korrekt berücksichtigt (Nav, Content, Kommentare)
- [x] `style.css` – Keine Standard-Emojis, Custom-Icons (SVG Sprite)
- [x] `style.css` – Kampagnen-spezifische Farbthemen (horizon, isekai, neue-langzeitkampagne)
- [x] `style.css` – Tintenklecks-Callout (block + inline)
- [x] `script.js` – Theme-Umschaltung (Light/Dark, System-Default)
- [x] `script.js` – SVG Icon-Wechsel beim Theme-Toggle
- [x] `script.js` – Theme-Cookie nur setzen wenn Kategorie 1 akzeptiert, sonst session-only
- [x] `base.html` – Inline-Script verhindert Theme-Flash beim Reload

### feat: Cookie & DSGVO

- [x] Cookie-Banner beim ersten Besuch
- [x] Kategorie 1: Theme-Präferenz (localStorage)
- [x] Kategorie 2: Komfort (Name + Autoren-Token)
- [x] Ablehnen → kein Cookie gesetzt, Theme läuft session-basiert
- [ ] Datenschutzseite `/datenschutz` – welche Cookies, wofür, wie löschen

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

- [ ] Kommentare – Bearbeiten/Löschen Admin (Phase 2)

### Install

- [x] `requirements.txt` – python-dotenv, python-multipart ergänzt
- [ ] Abhängigkeiten auf VDS installieren

### Test / Review

- [ ] Parser-Logik testen (Frontmatter, Callouts, Inline-Hidden)
- [ ] Multi-Vault-Routing testen (alle Domains)
- [ ] Kommentarsystem testen (Threading, Token, IP-Hash)
- [ ] Cookie-Banner testen (Opt-in/Opt-out, Session-Fallback)
- [ ] Admin-Login testen (IP-Whitelist, Session-Cookie, Vault-Filter)

### Deployment

- [ ] systemd Service `obsidian-wiki.service` einrichten
- [ ] Apache vHosts für alle Domains konfigurieren
- [ ] Certbot SSL einrichten
- [ ] Cloudflare DNS A-Records setzen# Obsidian Wiki – projekt-stand.md

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

## Admins

| Name | Vault-Zugriff |
| --- | --- |
| Niklas | `*` (alle Vaults) |
| Jana | `isekai-dnd` |

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (Domain: aktuell offen)

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
- [x] `parser.py` – Markdown + Frontmatter-Unterstützung
- [x] `parser.py` – Callout-Logik (`hidden`, `dm-only`)
- [x] `parser.py` – Inline-Hidden Syntax (`==text==` → Tintenklecks)
- [x] `comments.py` – SQLite Modell + Basis-Endpunkte
- [x] `routers/pages.py` – Routing auslagern aus `main.py`
- [x] `comments.py` – Threading (max. 5 Ebenen, `parent_id`-Spalte)
- [x] `comments.py` – IP-Hashing (SHA-256, vor Speicherung)
- [x] `comments.py` – Autoren-Token (zufälliger UUID, mit Kommentar gespeichert)
- [x] `comments.py` – Bearbeiten/Löschen per Autoren-Token (nur wenn Kategorie-2-Cookie gesetzt)
- [x] `admin/auth.py` – Tailscale-IP-Whitelist aus `.env`
- [x] `admin/auth.py` – Login-Route `/admin/login`, SHA-256 Passwort-Prüfung, Session-Cookie (30 min)
- [x] `admin/auth.py` – Multi-Admin aus `.env` (Niklas: alle Vaults, Jana: `isekai-dnd`)
- [x] `admin/auth.py` – Vault-spezifische Fehlermeldung bei falschem Kampagnenzugriff
- [x] `admin/router.py` – Kommentare einsehen, bearbeiten, löschen (vault-gefiltert)
- [x] `config.py` – VAULT_THEME_MAP + VAULT_ICON_MAP
- [x] `dependencies.py` – get_vault_theme(), get_vault_icon()

### Frontend

- [x] `base.html` – Grundlayout
- [x] `index.html` – Übersichtsseite
- [x] `page.html` – Einzelseite mit Callout-Rendering + Threading-Struktur
- [x] `404.html` – Fehlerseite mit Theme-Support
- [x] `admin/login.html` – Admin Login mit Name-Dropdown
- [x] `admin/dashboard.html` – Kommentarverwaltung
- [x] `icons.svg` – SVG Sprite (Sonne, Mond, Kampagnen-Icons)
- [x] `cookie-banner.html` – DSGVO-konformer Banner, Opt-in pro Kategorie
- [ ] Kommentarformular – Name vorausfüllen (Kategorie-2-Cookie)
- [ ] Kommentarformular – Felder leeren nach Absenden
- [ ] Kommentarformular – Threading-UI (Antworten, max. 5 Ebenen)
- [ ] Kommentare – Bearbeiten/Löschen-Button (nur wenn Autoren-Token im Cookie)
- [ ] `datenschutz.html` – Statische Datenschutzseite (Route `/datenschutz`)

### feat: Design

- [x] `style.css` – Komplett neu, schlicht mit Fantasy-Anklang, keine KI-Ästhetik
- [x] `style.css` – Dark/Light Theme, CSS Custom Properties auf `html`
- [x] `style.css` – System-Preference als Default beim ersten Besuch
- [x] `style.css` – Responsive Breakpoints (Mobile, Tablet, Desktop)
- [x] `style.css` – Viewport korrekt berücksichtigt (Nav, Content, Kommentare)
- [x] `style.css` – Keine Standard-Emojis, Custom-Icons (SVG Sprite)
- [x] `style.css` – Kampagnen-spezifische Farbthemen (horizon, isekai, neue-langzeitkampagne)
- [x] `style.css` – Tintenklecks-Callout (block + inline)
- [x] `script.js` – Theme-Umschaltung (Light/Dark, System-Default)
- [x] `script.js` – SVG Icon-Wechsel beim Theme-Toggle
- [x] `script.js` – Theme-Cookie nur setzen wenn Kategorie 1 akzeptiert, sonst session-only
- [x] `base.html` – Inline-Script verhindert Theme-Flash beim Reload

### feat: Cookie & DSGVO

- [x] Cookie-Banner beim ersten Besuch
- [x] Kategorie 1: Theme-Präferenz (localStorage)
- [x] Kategorie 2: Komfort (Name + Autoren-Token)
- [x] Ablehnen → kein Cookie gesetzt, Theme läuft session-basiert
- [ ] Datenschutzseite `/datenschutz` – welche Cookies, wofür, wie löschen

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

- [ ] Kommentare – Bearbeiten/Löschen Admin (Phase 2)

### Install

- [x] `requirements.txt` – python-dotenv, python-multipart ergänzt
- [ ] Abhängigkeiten auf VDS installieren

### Test / Review

- [ ] Parser-Logik testen (Frontmatter, Callouts, Inline-Hidden)
- [ ] Multi-Vault-Routing testen (alle Domains)
- [ ] Kommentarsystem testen (Threading, Token, IP-Hash)
- [ ] Cookie-Banner testen (Opt-in/Opt-out, Session-Fallback)
- [ ] Admin-Login testen (IP-Whitelist, Session-Cookie, Vault-Filter)

### Deployment

- [ ] systemd Service `obsidian-wiki.service` einrichten
- [ ] Apache vHosts für alle Domains konfigurieren
- [ ] Certbot SSL einrichten
- [ ] Cloudflare DNS A-Records setzen