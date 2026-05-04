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
    if (form) {
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
    }

    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const password = document.getElementById("password").value;
            const response = await fetch("/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, name: document.getElementById("admin-name").value })
            });

            if (response.ok) {
                window.location.href = "/admin";
            } else {
                const err = document.getElementById("error-msg");
                const data = await response.json();
                err.textContent = data.error;
                err.style.display = "block";
                setTimeout(() => { err.style.display = "none"; }, 30000);
            }
        });
    }

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const response = await fetch(`/admin/comments/${id}`, { method: "DELETE" });
            if (response.ok) {
                document.getElementById(`comment-${id}`).remove();
            }
        });
    });
});