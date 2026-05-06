import frontmatter
import markdown
import re
import yaml
from pathlib import Path


def parse_callouts(content: str) -> str:
    lines = content.split("\n")
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        if line.startswith("> [!dm-only]"):
            i += 1
            while i < len(lines) and lines[i].startswith(">"):
                i += 1
            continue

        if line.startswith("> [!hidden]"):
            result.append('<div class="callout-hidden"></div>')
            i += 1
            while i < len(lines) and lines[i].startswith(">"):
                i += 1
            continue

        line = re.sub(r'==(.+?)==', lambda m: f'<span class="inline-hidden">{"x" * len(m.group(1))}</span>', line)
        result.append(line)
        i += 1

    return "\n".join(result)


def parse_page(filepath: str) -> dict:
    with open(filepath, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)

    visibility = post.get("visibility", "public")
    title = post.get("title", Path(filepath).stem.replace("-", " ").title())
    content = parse_callouts(post.content)
    content_html = markdown.markdown(content)

    return {
        "visibility": visibility,
        "title": title,
        "content": content_html,
        "metadata": post.metadata
    }


def get_visibility(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        post = frontmatter.load(f)
    return post.get("visibility", "public")


def parse_toc(vault_path: str) -> list:
    toc_file = Path(vault_path) / "_toc.yml"
    if not toc_file.exists():
        return []
    with open(toc_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("chapters", [])


def flatten_toc(chapters: list, vault_path: str) -> list:
    flat = []

    def walk(items):
        for item in items:
            if "pages" in item:
                for page in item["pages"]:
                    slug = page["slug"]
                    filepath = Path(vault_path) / f"{slug}.md"
                    if not filepath.exists():
                        filepath = next(Path(vault_path).rglob(f"{slug}.md"), None)
                    if filepath and filepath.exists():
                        if get_visibility(str(filepath)) != "dm-only":
                            flat.append({
                                "slug": slug,
                                "title": page["title"],
                            })
            if "children" in item:
                walk(item["children"])

    walk(chapters)
    return flat