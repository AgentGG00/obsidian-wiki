import frontmatter
import markdown
import re

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
            result.append('<div class="callout-hidden">████████████████</div>')
            i += 1
            while i < len(lines) and lines[i].startswith(">"):
                i += 1
            continue

        result.append(line)
        i += 1

    return "\n".join(result)

def parse_page(filepath: str) -> dict:
    with open(filepath, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)
        
        visibility = post.get("visibility", "public")
        content = parse_callouts(post.content)
        content_html = markdown.markdown(content)

        return {
            "visibility": visibility,
            "content": content_html,
            "metadata": post.metadata
        }

def get_visibility(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        post = frontmatter.load(f)
    return post.get("visibility", "public")