import frontmatter
import markdown

def parse_page(filepath: str) -> dict:
    with open(filepath, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)
        
        visibility = post.get("visibility", "public")
        content_html = markdown.markdown(post.content)

        return {
            visibility: visibility,
            "content": content_html,
            "metadata": post.metadata
        }