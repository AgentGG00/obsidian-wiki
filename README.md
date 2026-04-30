# Obsidian Wiki

[![Deploy](https://img.shields.io/github/actions/workflow/status/AgentGG00/obsidian-wiki/deploy.yml?label=deploy)](https://github.com/AgentGG00/obsidian-wiki/actions)
[![Version](https://img.shields.io/github/v/release/AgentGG00/obsidian-wiki)](https://github.com/AgentGG00/obsidian-wiki/releases)
![Status](https://img.shields.io/badge/status-WIP-yellow)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org)
[![License](https://img.shields.io/github/license/AgentGG00/obsidian-wiki)](https://github.com/AgentGG00/obsidian-wiki/blob/main/LICENSE)

Selbst gehostete Wiki-Webapp für D&D-Kampagnen. Spieler lesen Lore, NPCs und Orte im Browser – der DM steuert die Sichtbarkeit direkt aus Obsidian heraus.

## Features

- Markdown-Seiten aus Obsidian Vault rendern
- Sichtbarkeit pro Seite via Frontmatter (`public`, `dm-only`)
- Sichtbarkeit pro Abschnitt via Callouts (`hidden`, `dm-only`)
- Multi-Vault-Support über Host-Header-Routing
- Anonymes Kommentarsystem (kein Login)
- Dark Fantasy-Theme

## Installation

```bash
git clone https://github.com/AgentGG00/obsidian-wiki.git
cd obsidian-wiki
cp .env.example .env
pip install -r requirements.txt
```

## License

[MIT](LICENSE)
