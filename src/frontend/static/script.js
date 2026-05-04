const k1Consent = document.cookie.includes("cookie_consent_k1=true");
const themes = ["light", "dark"];
let currentTheme = (k1Consent ? localStorage.getItem("theme") : null) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
}

function cycleTheme() {
    const index = themes.indexOf(currentTheme);
    currentTheme = themes[(index + 1) % themes.length];
    const k1 = document.cookie.includes("cookie_consent_k1=true");
    if (k1) localStorage.setItem("theme", currentTheme);
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

    const banner = document.getElementById("cookie-banner");
    const overlay = document.getElementById("cookie-overlay");

    function hideBanner() {
        if (banner) banner.style.display = "none";
        if (overlay) overlay.style.display = "none";
    }

    function applyConsent(k1, k2) {
        if (k1 === "true") {
            localStorage.setItem("theme", currentTheme);
        } else {
            localStorage.removeItem("theme");
        }
        document.cookie = `cookie_consent_k1=${k1}; path=/; max-age=${60*60*24*365}`;
        document.cookie = `cookie_consent_k2=${k2}; path=/; max-age=${60*60*24*365}`;
        hideBanner();
    }

    const consentK1 = document.cookie.includes("cookie_consent_k1=");

    if (!consentK1) {
        if (banner) banner.style.display = "block";
        if (overlay) overlay.style.display = "block";
    } else {
        hideBanner();
    }

    document.getElementById("cookie-accept")?.addEventListener("click", () => {
        const k1 = document.getElementById("cookie-k1")?.checked ? "true" : "false";
        const k2 = document.getElementById("cookie-k2")?.checked ? "true" : "false";
        applyConsent(k1, k2);
    });

    document.getElementById("cookie-accept-all")?.addEventListener("click", () => {
        applyConsent("true", "true");
    });

    document.getElementById("cookie-reject")?.addEventListener("click", () => {
        applyConsent("false", "false");
    });
});