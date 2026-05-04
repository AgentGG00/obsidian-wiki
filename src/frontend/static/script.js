// ============================================================
// THEME
// ============================================================

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


// ============================================================
// HILFSFUNKTIONEN
// ============================================================

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 24 * 60 * 60}`;
}

function closeAllMenus() {
    document.querySelectorAll(".menu-dropdown").forEach(d => d.classList.remove("open"));
}

function closeAllReplyForms() {
    document.querySelectorAll(".reply-form").forEach(f => f.classList.remove("open"));
}

function confirmDelete(onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";

    const popout = document.createElement("div");
    popout.className = "confirm-popout";
    popout.innerHTML = `
        <p>Kommentar wirklich löschen?</p>
        <div class="form-actions">
            <button class="btn" id="confirm-cancel">Abbrechen</button>
            <button class="btn btn-danger" id="confirm-ok">Ja, löschen</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popout);

    function cleanup() {
        overlay.remove();
        popout.remove();
    }

    popout.querySelector("#confirm-ok").addEventListener("click", () => {
        cleanup();
        onConfirm();
    });

    popout.querySelector("#confirm-cancel").addEventListener("click", cleanup);
    overlay.addEventListener("click", cleanup);
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    updateToggleLabel();

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", cycleTheme);


    // --------------------------------------------------------
    // KOMMENTARE – Name vorausfüllen
    // --------------------------------------------------------

    const authorInput = document.getElementById("author");
    if (authorInput) {
        const savedName = getCookie("author_name");
        if (savedName) authorInput.value = savedName;
    }


    // --------------------------------------------------------
    // KOMMENTARE – Hauptformular absenden
    // --------------------------------------------------------

    const submitBtn = document.getElementById("submit-comment");
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const author = document.getElementById("author").value.trim();
            const content = document.getElementById("content").value.trim();
            const slug = window.location.pathname.slice(1);
            if (!author || !content) return;

            const response = await fetch(`/comments/${slug}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author_name: author, content })
            });

            if (response.ok) {
                if (document.cookie.includes("cookie_consent_k2=true")) {
                    setCookie("author_name", author, 365);
                }
                location.reload();
            }
        });
    }


    // --------------------------------------------------------
    // KOMMENTARE – Antworten
    // --------------------------------------------------------

    document.querySelectorAll(".reply-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            closeAllReplyForms();
            closeAllMenus();
            const form = document.getElementById(`reply-form-${id}`);
            if (!form) return;
            form.classList.add("open");
            const replyAuthor = form.querySelector(".reply-author");
            if (replyAuthor) {
                const savedName = getCookie("author_name");
                if (savedName) replyAuthor.value = savedName;
                replyAuthor.focus();
            }
        });
    });

    document.querySelectorAll(".cancel-reply-form-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const form = document.getElementById(`reply-form-${btn.dataset.id}`);
            if (form) form.classList.remove("open");
        });
    });

    document.querySelectorAll(".submit-reply-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const parentId = parseInt(btn.dataset.id);
            const form = document.getElementById(`reply-form-${parentId}`);
            const author = form.querySelector(".reply-author").value.trim();
            const content = form.querySelector(".reply-content").value.trim();
            const slug = window.location.pathname.slice(1);
            if (!author || !content) return;

            const response = await fetch(`/comments/${slug}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author_name: author, content, parent_id: parentId })
            });

            if (response.ok) {
                if (document.cookie.includes("cookie_consent_k2=true")) {
                    setCookie("author_name", author, 365);
                }
                location.reload();
            }
        });
    });


    // --------------------------------------------------------
    // KOMMENTARE – Drei-Punkte-Menü
    // --------------------------------------------------------

    document.querySelectorAll(".menu-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById(`menu-${btn.dataset.id}`);
            const isOpen = dropdown?.classList.contains("open");
            closeAllMenus();
            if (!isOpen) dropdown?.classList.add("open");
        });
    });

    document.addEventListener("click", closeAllMenus);


    // --------------------------------------------------------
    // KOMMENTARE – Bearbeiten (eigener Kommentar)
    // --------------------------------------------------------

    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            closeAllMenus();
            document.getElementById(`body-${id}`).style.display = "none";
            document.getElementById(`edit-${id}`).classList.add("open");
        });
    });

    document.querySelectorAll(".cancel-edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            document.getElementById(`body-${id}`).style.display = "";
            document.getElementById(`edit-${id}`).classList.remove("open");
        });
    });

    document.querySelectorAll(".save-edit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const content = document.querySelector(`#edit-${id} .edit-content`).value.trim();
            if (!content) return;

            const response = await fetch(`/comments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author_name: "", content })
            });

            if (response.ok) location.reload();
        });
    });


    // --------------------------------------------------------
    // KOMMENTARE – Löschen (eigener Kommentar)
    // --------------------------------------------------------

    document.querySelectorAll(".delete-own-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            closeAllMenus();
            confirmDelete(async () => {
                const response = await fetch(`/comments/${id}`, { method: "DELETE" });
                if (response.ok) location.reload();
            });
        });
    });


    // --------------------------------------------------------
    // ADMIN – Login + Enter-Taste
    // --------------------------------------------------------

    const loginBtn = document.getElementById("login-btn");

    document.getElementById("password")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loginBtn?.click();
    });

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


    // --------------------------------------------------------
    // ADMIN – Kommentar bearbeiten
    // --------------------------------------------------------

    document.querySelectorAll(".admin-edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            document.getElementById(`body-${id}`).style.display = "none";
            document.getElementById(`edit-${id}`).classList.add("open");
        });
    });

    document.querySelectorAll(".admin-cancel-edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            document.getElementById(`body-${id}`).style.display = "";
            document.getElementById(`edit-${id}`).classList.remove("open");
        });
    });

    document.querySelectorAll(".admin-save-edit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const content = document.querySelector(`#edit-${id} .edit-content`).value.trim();
            if (!content) return;

            const response = await fetch(`/admin/comments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                document.getElementById(`body-${id}`).textContent = content;
                document.getElementById(`body-${id}`).style.display = "";
                document.getElementById(`edit-${id}`).classList.remove("open");
            }
        });
    });


    // --------------------------------------------------------
    // ADMIN – Kommentar löschen
    // --------------------------------------------------------

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            confirmDelete(async () => {
                const response = await fetch(`/admin/comments/${id}`, { method: "DELETE" });
                if (response.ok) {
                    document.getElementById(`comment-${id}`).remove();
                }
            });
        });
    });


    // --------------------------------------------------------
    // COOKIE-BANNER
    // --------------------------------------------------------

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
        document.cookie = `cookie_consent_k1=${k1}; path=/; max-age=${60 * 60 * 24 * 365}`;
        document.cookie = `cookie_consent_k2=${k2}; path=/; max-age=${60 * 60 * 24 * 365}`;
        hideBanner();
    }

    if (!document.cookie.includes("cookie_consent_k1=")) {
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

    document.getElementById("cookie-accept-all")?.addEventListener("click", () => applyConsent("true", "true"));
    document.getElementById("cookie-reject")?.addEventListener("click", () => applyConsent("false", "false"));
});