document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comment-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const author = document.getElementById("author").value;
    const content = document.getElementById("content").value;
    const slug = window.location.pathname.replace("/", "");

    const response = await fetch(`/comments/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_name: author, content: content }),
    });

    if (response.ok) {
      location.reload();
    }
  });
});