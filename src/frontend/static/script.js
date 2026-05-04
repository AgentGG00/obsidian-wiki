const themes = ["light", "dark"];
let currentTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
}

function cycleTheme() {
    const index = themes.indexOf(currentTheme);
    currentTheme = themes[(index + 1) % themes.length];
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
    updateToggleLabel();
}

function updateToggleLabel() {
    const use = document.getElementById("theme-icon-use");
    if (!use) return;
    use.setAttribute("href", currentTheme === "dark" ? "#icon-moon" : "#icon-sun");
}

applyTheme(currentTheme);

document.addEventListener("DOMContentLoaded", () => {
    updateToggleLabel();

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", cycleTheme);

    const form = document.getElementById("comment-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const authorInput = document.getElementById("author");
        const contentInput = document.getElementById("content");
        const slug = window.location.pathname.replace("/", "");

        const response = await fetch(`/comments/${slug}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ author_name: authorInput.value, content: contentInput.value }),
        });

        if (response.ok) {
            authorInput.value = "";
            contentInput.value = "";
        }
    });
});
