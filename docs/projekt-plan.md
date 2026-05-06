# Obsidian Wiki – projekt-plan.md

## Projektbeschreibung

Eine selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler können Lore, NPCs, Orte und andere Kampagneninhalte im Browser nachlesen. Der DM kontrolliert granular welche Inhalte öffentlich sichtbar, geschwärzt oder komplett versteckt sind. Inhalte werden in Obsidian verfasst und von Claude via MCP unterstützt ausgearbeitet.

## Ziele

- DM kann Inhalte direkt in Obsidian schreiben ohne separaten CMS-Workflow
- Spieler können Kampagneninhalte anonym im Browser lesen und kommentieren
- Sichtbarkeit wird pro Seite (Frontmatter) und pro Abschnitt (Callouts) gesteuert
- Eine FastAPI-Instanz bedient mehrere Kampagnen-Wikis über Host-Header-Routing
- Kein Build-Prozess, kein JavaScript-Framework – serverseitig gerendert

## Zielgruppe

| Rolle | Nutzung |
| --- | --- |
| DM | Inhalte in Obsidian schreiben, Sichtbarkeit steuern, Claude als Schreibassistent |
| Spieler | Wiki im Browser lesen, anonym kommentieren |

## Anforderungen

### Funktional

- Markdown-Seiten aus Obsidian Vault rendern
- Frontmatter-basierte Sichtbarkeit pro Seite (`public`, `dm-only`)
- Callout-basierte Sichtbarkeit pro Abschnitt (`hidden`, `dm-only`)
- Index-Seite mit Übersicht aller öffentlichen Seiten
- Anonymes Kommentarsystem pro Seite (kein Login)
- 404-Seite
- Multi-Vault-Support über Host-Header-Routing (eine Instanz, mehrere Domains)

### Nicht-funktional

- Kein Login für Spieler
- Kein JavaScript-Framework – Jinja2 Templates
- Kein separater Datenbankserver – SQLite reicht
- Responsive, dark Fantasy-Theme
- Läuft direkt auf VDS hinter Apache Reverse Proxy (kein Docker)

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

## Architektur

``` text
Browser (Spieler)
  └── Cloudflare (Proxy)
        └── Apache (Reverse Proxy, Host-Header-Routing)
              └── FastAPI (eine Instanz, Port 8090)
                    ├── src/backend/config.py     → Domain → Vault-Ordner Mapping
                    ├── src/backend/parser.py     → Markdown + Frontmatter + Callouts
                    ├── src/backend/comments.py   → SQLite Kommentare
                    └── /data/nas/vaults/[vault]/ → Obsidian Vault Dateien
```

### Domain-zu-Vault-Mapping

| Domain | Vault |
| --- | --- |
| `horizon.framenode.net` | `/data/nas/vaults/horizon-dnd/` |
| `isekai.framenode.net` | `/data/nas/vaults/isekai-dnd/` |
| `[offen]` | `/data/nas/vaults/Otherworld/` |

## Sichtbarkeits-System

### Ebene 1 – Frontmatter (ganze Seite)

```yaml
---
visibility: public    # Spieler sehen die Seite normal
visibility: dm-only   # Seite existiert nicht im Wiki für Spieler
---
```

Kein Frontmatter → standardmäßig `public`.

### Ebene 2 – Callouts (abschnittsweise)

```markdown
> [!hidden]
> Inhalt wird als schwarzer Balken dargestellt – kein Text sichtbar

> [!dm-only]
> Inhalt ist für Spieler komplett unsichtbar
```

Normaler Text außerhalb von Callouts ist immer öffentlich.

## Kommentarsystem

- Anonym, kein Login erforderlich
- SQLite-Tabelle: `comments(id, vault, page_slug, author_name, content, created_at)`
- Kein Spam-Schutz in Phase 1 (Spielerkreis klein und bekannt)
- DM-seitiges Löschen von Kommentaren: offen (Phase 2)

## Projektstruktur

``` text
obsidian-wiki/
  ├── src/
  │   ├── backend/
  │   │   ├── routers/
  │   │   │   └── pages.py
  │   │   ├── config.py
  │   │   ├── parser.py
  │   │   ├── comments.py
  │   │   └── main.py
  │   ├── frontend/
  │   │   ├── templates/
  │   │   │   ├── base.html
  │   │   │   ├── page.html
  │   │   │   ├── index.html
  │   │   │   └── 404.html
  │   │   └── static/
  │   │       ├── style.css
  │   │       └── script.js
  │   └── db/
  │       └── .gitkeep
  ├── docs/
  │   ├── projekt-plan.md
  │   └── projekt-stand.md
  ├── requirements.txt
  ├── .env.example
  ├── .gitignore
  ├── README.md
  └── LICENSE
```

## Deployment-Ziel

- Pfad auf VDS: `/var/www/obsidian-wiki/`
- systemd Service: `obsidian-wiki.service`
- FastAPI läuft auf `127.0.0.1:8090`
- Apache vHosts für alle drei Domains
- Certbot SSL nach erstem Deployment

## Offene Entscheidungen

- [ ] Name der dritten Kampagne (Domain: aktuell offen)
- [ ] Design/Theme der Wiki-Oberfläche (dark Fantasy-Stil geplant)
- [ ] Kommentare moderierbar durch DM (Phase 2)
