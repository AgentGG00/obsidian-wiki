class BookEngine {
    constructor() {
        this.flat = [];
        this.toc = [];
        this.currentIdx = -1;
        this.isAnimating = false;
        this.history = [];

        this.lastKeyTime = 0;
        this.keyPressCount = 0;
        this.keyTimer = null;
    }

    async init() {
        const res = await fetch('/api/toc');
        const data = await res.json();
        this.toc = data.chapters;
        this.flat = data.flat;

        const path = window.location.pathname;
        if (path !== '/' && path !== '') {
            const slug = path.slice(1);
            const idx = this.flat.findIndex(p => p.slug === slug);
            if (idx >= 0) this.currentIdx = idx;
        }

        this.buildTocDropdown();
        this.updateHeader();
        this.updateFooter();
        this.setupEvents();
    }

    updateHeader() {
        const backBtn = document.getElementById('back-btn');
        const backSep = document.getElementById('back-separator');
        const backLabel = document.getElementById('back-label');

        if (this.history.length > 0) {
            const prev = this.history[this.history.length - 1];
            backBtn.style.display = 'flex';
            backSep.style.display = 'block';
            backLabel.textContent = prev.title;
        } else {
            backBtn.style.display = 'none';
            backSep.style.display = 'none';
        }

        this.updateTocActive();
    }

    updateFooter() {
        const num = document.getElementById('page-num');
        const prevBtn = document.getElementById('nav-prev');
        const nextBtn = document.getElementById('nav-next');

        const isFirst = this.currentIdx === -1;
        const isLast = this.currentIdx >= this.flat.length - 1;

        num.textContent = this.currentIdx === -1 ? '' : this.currentIdx + 1;

        prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
        nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
    }

    async navigateTo(idx, addHistory = true) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const direction = idx > this.currentIdx ? 1 : -1;

        if (addHistory) {
            const currentTitle = this.currentIdx === -1
                ? 'Inhaltsverzeichnis'
                : this.flat[this.currentIdx]?.title || '';
            this.history.push({ title: currentTitle, idx: this.currentIdx });
        }

        this.currentIdx = idx;
        await this.animateOut(direction);

        if (idx === -1) {
            window.location.href = '/';
            return;
        }

        const slug = this.flat[idx].slug;
        const res = await fetch(`/api/page/${slug}`);
        const data = await res.json();

        const content = document.getElementById('page-content');
        content.innerHTML = `<article class="wiki-page"><h1>${data.title}</h1><div class="wiki-content">${data.content}</div></article>`;
        content.scrollTop = 0;

        window.history.pushState({ idx }, '', `/${slug}`);

        await this.animateIn(direction);

        this.updateHeader();
        this.updateFooter();
    }

    async navigateBack() {
        if (this.history.length === 0) return;
        const prev = this.history.pop();
        await this.navigateTo(prev.idx, false);
    }

    navigate(count, direction) {
        if (count === 1) {
            const newIdx = this.currentIdx + direction;
            if (newIdx < -1 || newIdx >= this.flat.length) return;
            this.navigateTo(newIdx);
        } else if (count === 2) {
            this.navigateSubchapter(direction);
        } else if (count >= 3) {
            this.navigateChapter(direction);
        }
    }

    navigateSubchapter(direction) {
        if (this.currentIdx === -1) {
            if (direction > 0) this.navigateTo(0);
            return;
        }
        const currentPath = this.flat[this.currentIdx]?.subchapter_path;

        if (direction > 0) {
            for (let i = this.currentIdx + 1; i < this.flat.length; i++) {
                if (this.flat[i].subchapter_path !== currentPath) {
                    this.navigateTo(i);
                    return;
                }
            }
        } else {
            for (let i = this.currentIdx - 1; i >= 0; i--) {
                if (this.flat[i].subchapter_path !== currentPath) {
                    const targetPath = this.flat[i].subchapter_path;
                    let first = i;
                    while (first > 0 && this.flat[first - 1].subchapter_path === targetPath) first--;
                    this.navigateTo(first);
                    return;
                }
            }
            this.navigateTo(-1);
        }
    }

    navigateChapter(direction) {
        if (this.currentIdx === -1) {
            if (direction > 0 && this.flat.length > 0) this.navigateTo(0);
            return;
        }
        const currentChapter = this.flat[this.currentIdx]?.chapter_idx ?? 0;

        if (direction > 0) {
            for (let i = this.currentIdx + 1; i < this.flat.length; i++) {
                if (this.flat[i].chapter_idx !== currentChapter) {
                    this.navigateTo(i);
                    return;
                }
            }
        } else {
            const prevChapter = currentChapter - 1;
            if (prevChapter < 0) {
                this.navigateTo(-1);
                return;
            }
            for (let i = 0; i < this.flat.length; i++) {
                if (this.flat[i].chapter_idx === prevChapter) {
                    this.navigateTo(i);
                    return;
                }
            }
            this.navigateTo(-1);
        }
    }

    animateOut(direction) {
        return new Promise(resolve => {
            const page = document.getElementById('book-page');
            const cls = direction > 0 ? 'slide-out-left' : 'slide-out-right';
            page.classList.add(cls);
            setTimeout(() => {
                page.classList.remove(cls);
                resolve();
            }, 180);
        });
    }

    animateIn(direction) {
        return new Promise(resolve => {
            const page = document.getElementById('book-page');
            const cls = direction > 0 ? 'slide-in-right' : 'slide-in-left';
            page.classList.add(cls);
            setTimeout(() => {
                page.classList.remove(cls);
                this.isAnimating = false;
                resolve();
            }, 180);
        });
    }

    buildTocDropdown() {
        const inner = document.getElementById('toc-dropdown-inner');
        inner.innerHTML = '';

        // Inhaltsverzeichnis Link
        const homeDiv = document.createElement('div');
        homeDiv.className = 'toc-home';
        const homeA = document.createElement('a');
        homeA.textContent = 'Inhaltsverzeichnis';
        homeA.href = '/';
        homeA.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo(-1);
            document.getElementById('toc-dropdown').hidden = true;
        });
        homeDiv.appendChild(homeA);
        inner.appendChild(homeDiv);

        const renderNode = (node, depth) => {
            const div = document.createElement('div');
            div.className = `toc-node toc-depth-${depth}`;

            const header = document.createElement('div');
            header.className = 'toc-node-header';

            const titleEl = document.createElement('span');
            titleEl.className = 'toc-node-title';
            titleEl.textContent = node.title;
            header.appendChild(titleEl);

            const hasChildren = node.children && node.children.length > 0;
            const hasPages = node.pages && node.pages.length > 0;

            if (hasChildren || hasPages) {
                const toggle = document.createElement('button');
                toggle.className = 'toc-collapse-btn';
                toggle.innerHTML = '&#9660;';
                toggle.setAttribute('aria-label', 'Ein-/Ausklappen');
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isCollapsed = div.classList.toggle('collapsed');
                    toggle.innerHTML = isCollapsed ? '&#9658;' : '&#9660;';
                });
                header.appendChild(toggle);
            }

            div.appendChild(header);

            if (hasPages) {
                const ul = document.createElement('ul');
                ul.className = 'toc-page-list';
                for (const page of node.pages) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.textContent = page.title;
                    a.dataset.slug = page.slug;
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        const idx = this.flat.findIndex(p => p.slug === page.slug);
                        if (idx >= 0) this.navigateTo(idx);
                        document.getElementById('toc-dropdown').hidden = true;
                    });
                    li.appendChild(a);
                    ul.appendChild(li);
                }
                div.appendChild(ul);
            }

            if (hasChildren) {
                const childContainer = document.createElement('div');
                childContainer.className = 'toc-children';
                for (const child of node.children) {
                    childContainer.appendChild(renderNode(child, depth + 1));
                }
                div.appendChild(childContainer);
            }

            return div;
        };

        for (const chapter of this.toc) {
            inner.appendChild(renderNode(chapter, 0));
        }
    }

    updateTocActive() {
        const currentSlug = this.currentIdx >= 0 ? this.flat[this.currentIdx]?.slug : null;
        document.querySelectorAll('.toc-page-list a[data-slug]').forEach(a => {
            a.classList.toggle('active', a.dataset.slug === currentSlug);
        });
    }

    setupEvents() {
        document.getElementById('nav-prev').addEventListener('click', () => this.navigate(1, -1));
        document.getElementById('nav-next').addEventListener('click', () => this.navigate(1, 1));
        document.getElementById('back-btn').addEventListener('click', () => this.navigateBack());

        const tocBtn = document.getElementById('toc-toggle');
        const tocDropdown = document.getElementById('toc-dropdown');

        tocBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = tocDropdown.hidden;
            tocDropdown.hidden = !isHidden;
            if (!tocDropdown.hidden) {
                requestAnimationFrame(() => {
                    tocDropdown.scrollTop = 0;
                });
            }
        });

        tocDropdown.addEventListener('click', (e) => e.stopPropagation());

        document.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            const direction = e.key === 'ArrowRight' ? 1 : -1;
            const now = Date.now();
            if (now - this.lastKeyTime < 300) {
                this.keyPressCount++;
            } else {
                this.keyPressCount = 1;
            }
            this.lastKeyTime = now;
            clearTimeout(this.keyTimer);
            this.keyTimer = setTimeout(() => {
                const count = this.keyPressCount;
                this.keyPressCount = 0;
                this.navigate(count, direction);
            }, 350);
        });

        let touchStartX = 0;
        let touchStartY = 0;
        let touchCount = 0;
        let touchStartTime = 0;

        document.getElementById('book-stage').addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchCount = e.touches.length;
            touchStartTime = Date.now();
        }, { passive: true });

        document.getElementById('book-stage').addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const dt = Date.now() - touchStartTime;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) || dt > 600) return;
            const direction = dx < 0 ? 1 : -1;
            this.navigate(touchCount, direction);
        }, { passive: true });

        window.addEventListener('popstate', async (e) => {
            if (e.state !== null && e.state.idx !== undefined) {
                this.currentIdx = e.state.idx;
                if (this.currentIdx >= 0) {
                    const slug = this.flat[this.currentIdx]?.slug;
                    if (slug) {
                        const res = await fetch(`/api/page/${slug}`);
                        const data = await res.json();
                        document.getElementById('page-content').innerHTML =
                            `<article class="wiki-page"><h1>${data.title}</h1><div class="wiki-content">${data.content}</div></article>`;
                        this.updateHeader();
                        this.updateFooter();
                    }
                }
            }
        });
    }
}


// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const themes = ['light', 'dark'];
    let currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    function updateToggleLabel() {
        const use = document.getElementById('theme-icon-use');
        if (!use) return;
        use.setAttribute('href', currentTheme === 'dark' ? '#icon-moon' : '#icon-sun');
    }

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const index = themes.indexOf(currentTheme);
        currentTheme = themes[(index + 1) % themes.length];
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateToggleLabel();
    });

    updateToggleLabel();

    const tocAvailable = await fetch('/api/toc').then(r => r.ok).catch(() => false);
    if (!tocAvailable) return;

    const engine = new BookEngine();
    window.bookEngine = engine;
    await engine.init();
});