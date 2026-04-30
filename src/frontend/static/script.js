// Theme
const themes = ["system", "light", "dark"];
let currentTheme = localStorage.getItem("theme") || "system";

function applyTheme(theme) {
    if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
}

function cycleTheme() {
    const index = themes.indexOf(currentTheme);
    currentTheme = themes[(index + 1) % themes.length];
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
    updateToggleLabel();
}

function updateToggleLabel() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const labels = { system: "🌓 System", light: "☀️ Hell", dark: "🌙 Dunkel" };
    btn.textContent = labels[currentTheme];
}

applyTheme(currentTheme);

document.addEventListener("DOMContentLoaded", () => {
    updateToggleLabel();

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", cycleTheme);

    // Kommentare
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