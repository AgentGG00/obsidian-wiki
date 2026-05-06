// ============================================================
// THEME
// ============================================================

const themes = ["light", "dark"];
let currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function cycleTheme() {
    const index = themes.indexOf(currentTheme);
    currentTheme = themes[(index + 1) % themes.length];
    applyTheme(currentTheme);
    updateToggleLabel();
}

function updateToggleLabel() {
    const use = document.getElementById("theme-icon-use");
    if (!use) return;
    use.setAttribute("href", currentTheme === "dark" ? "#icon-moon" : "#icon-sun");
}

applyTheme(currentTheme);


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    updateToggleLabel();

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", cycleTheme);
});