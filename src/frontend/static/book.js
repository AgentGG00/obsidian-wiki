class BookEngine {
    constructor() {
        this.toc = [];
        this.flat = [];
        this.pages = [];
        this.currentMd = 0;
        this.currentPage = 0;
        this.isDouble = false;
        this.isAnimating = false;

        this.clickCount = 0;
        this.clickTimer = null;
        this.lastKeyTime = 0;
        this.keyPressCount = 0;
        this.keyTimer = null;
    }

    async init() {
        const res = await fetch('/api/toc');
        const data = await res.json();
        this.toc = data.chapters;
        this.flat = data.flat;

        this.updateLayout();
        this.buildTocDropdown();
        this.setupHiddenRender();

        await this.loadMd(this.currentMd);
        this.render();
        this.setupEvents();

        if (this.flat.length > 1) {
            this.loadMd(1);
        }
    }

    updateLayout() {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        const isWide = window.innerWidth >= 1024;
        const isTabletLandscape = window.innerWidth >= 768 && isLandscape;
        this.isDouble = isWide || isTabletLandscape;
        document.body.classList.toggle('single-page', !this.isDouble);
        document.body.classList.toggle('double-page', this.isDouble);
        document.body.classList.add('layout-ready');
    }

    getPageDimensions() {
        const stage = document.getElementById('book-stage');
        const stageRect = stage.getBoundingClientRect();
        const width = this.isDouble ? (stageRect.width - 2) / 2 : stageRect.width;
        const height = stageRect.height;
        return { width, height };
    }

    setupHiddenRender() {
        const hidden = document.getElementById('book-hidden-render');
        const { width, height } = this.getPageDimensions();
        const contentEl = document.querySelector('.book-page-content');
        if (!contentEl) return;
        const style = getComputedStyle(contentEl);
        hidden.style.width = width + 'px';
        hidden.style.height = height + 'px';
        hidden.style.padding = style.padding;
        hidden.style.fontFamily = style.fontFamily;
        hidden.style.fontSize = style.fontSize;
        hidden.style.lineHeight = style.lineHeight;
    }

    async loadMd(mdIndex) {
        if (this.pages[mdIndex] !== undefined) return;

        const slug = this.flat[mdIndex]?.slug;
        if (!slug) return;

        const res = await fetch(`/api/page/${slug}`);
        if (!res.ok) {
            this.pages[mdIndex] = ['<p>Seite nicht gefunden.</p>'];
            return;
        }
        const data = await res.json();
        const fullHtml = `<h1>${data.title}</h1>${data.content}`;
        this.pages[mdIndex] = this.splitContent(fullHtml);
    }

    splitContent(html) {
        const hidden = document.getElementById('book-hidden-render');
        const { height } = this.getPageDimensions();
        const contentEl = document.querySelector('.book-page-content');
        if (!contentEl) return [html];

        const style = getComputedStyle(contentEl);
        const paddingTop = parseFloat(style.paddingTop);
        const paddingBottom = parseFloat(style.paddingBottom);
        const availableHeight = height - paddingTop - paddingBottom;

        hidden.innerHTML = html;

        const pages = [];
        let currentPageHtml = '';
        let currentHeight = 0;

        const children = Array.from(hidden.children);

        for (const node of children) {
            const clone = node.cloneNode(true);
            const measurer = document.createElement('div');
            measurer.style.position = 'absolute';
            measurer.style.visibility = 'hidden';
            measurer.style.width = hidden.style.width;
            measurer.appendChild(clone);
            document.body.appendChild(measurer);
            const nodeHeight = measurer.getBoundingClientRect().height;
            document.body.removeChild(measurer);

            if (currentHeight + nodeHeight > availableHeight && currentPageHtml !== '') {
                pages.push(currentPageHtml);
                currentPageHtml = '';
                currentHeight = 0;
            }

            currentPageHtml += node.outerHTML;
            currentHeight += nodeHeight;
        }

        if (currentPageHtml !== '') {
            pages.push(currentPageHtml);
        }

        hidden.innerHTML = '';
        return pages.length > 0 ? pages : [html];
    }

    render(direction = null) {
        const leftEl = document.getElementById('page-content-left');
        const rightEl = document.getElementById('page-content-right');
        const pageNumLeft = document.getElementById('page-num-left');
        const pageNumRight = document.getElementById('page-num-right');

        const currentPages = this.pages[this.currentMd] || [''];

        if (this.isDouble) {
            const rightContent = currentPages[this.currentPage] || '';
            const leftContent = this.currentPage > 0
                ? currentPages[this.currentPage - 1] || ''
                : this.getPrevPageContent();

            leftEl.innerHTML = leftContent;
            rightEl.innerHTML = rightContent;

            pageNumLeft.textContent = leftContent
                ? this.getGlobalPageNumber(this.currentMd, Math.max(0, this.currentPage - 1))
                : '';
            pageNumRight.textContent = this.getGlobalPageNumber(this.currentMd, this.currentPage);
        } else {
            leftEl.innerHTML = '';
            rightEl.innerHTML = currentPages[this.currentPage] || '';
            pageNumLeft.textContent = '';
            pageNumRight.textContent = this.getGlobalPageNumber(this.currentMd, this.currentPage);
        }

        document.getElementById('nav-prev').disabled = this.isFirst();
        document.getElementById('nav-next').disabled = this.isLast();

        this.updateTocActive();
    }

    getPrevPageContent() {
        if (this.currentMd === 0) return '';
        const prevPages = this.pages[this.currentMd - 1];
        if (!prevPages) return '';
        return prevPages[prevPages.length - 1] || '';
    }

    getGlobalPageNumber(mdIndex, pageIndex) {
        let count = 1;
        for (let i = 0; i < mdIndex; i++) {
            count += (this.pages[i] || []).length;
        }
        count += pageIndex;
        return count;
    }

    isFirst() {
        return this.currentMd === 0 && this.currentPage === 0;
    }

    isLast() {
        const pages = this.pages[this.currentMd] || [];
        return this.currentMd === this.flat.length - 1 && this.currentPage >= pages.length - 1;
    }

    async navigatePage(direction) {
        if (this.isAnimating) return;

        if (direction > 0) {
            const pages = this.pages[this.currentMd] || [];
            if (this.currentPage < pages.length - 1) {
                this.currentPage++;
            } else if (this.currentMd < this.flat.length - 1) {
                this.currentMd++;
                this.currentPage = 0;
                await this.loadMd(this.currentMd);
                if (this.currentMd + 1 < this.flat.length) this.loadMd(this.currentMd + 1);
            } else {
                return;
            }
        } else {
            if (this.currentPage > 0) {
                this.currentPage--;
            } else if (this.currentMd > 0) {
                this.currentMd--;
                await this.loadMd(this.currentMd);
                this.currentPage = (this.pages[this.currentMd] || []).length - 1;
            } else {
                return;
            }
        }

        this.animate(direction);
        this.render(direction);
    }

    async navigateMd(direction) {
        if (this.isAnimating) return;
        const newMd = this.currentMd + direction;
        if (newMd < 0 || newMd >= this.flat.length) return;
        this.currentMd = newMd;
        this.currentPage = 0;
        await this.loadMd(this.currentMd);
        this.animate(direction);
        this.render(direction);
    }

    async navigateChapter(direction) {
        if (this.isAnimating) return;
        const currentSlug = this.flat[this.currentMd]?.slug;
        const currentChapterIndex = this.getChapterIndexForSlug(currentSlug);
        const targetChapterIndex = currentChapterIndex + direction;
        const targetSlug = this.getFirstSlugInChapter(targetChapterIndex);
        if (!targetSlug) return;
        const targetMdIndex = this.flat.findIndex(p => p.slug === targetSlug);
        if (targetMdIndex === -1) return;
        this.currentMd = targetMdIndex;
        this.currentPage = 0;
        await this.loadMd(this.currentMd);
        this.animate(direction);
        this.render(direction);
    }

    getChapterIndexForSlug(slug) {
        for (let i = 0; i < this.toc.length; i++) {
            if (this.chapterContainsSlug(this.toc[i], slug)) return i;
        }
        return 0;
    }

    chapterContainsSlug(chapter, slug) {
        if (chapter.pages) {
            for (const p of chapter.pages) {
                if (p.slug === slug) return true;
            }
        }
        if (chapter.children) {
            for (const child of chapter.children) {
                if (this.chapterContainsSlug(child, slug)) return true;
            }
        }
        return false;
    }

    getFirstSlugInChapter(chapterIndex) {
        const chapter = this.toc[chapterIndex];
        if (!chapter) return null;
        return this.getFirstSlugInNode(chapter);
    }

    getFirstSlugInNode(node) {
        if (node.pages && node.pages.length > 0) return node.pages[0].slug;
        if (node.children) {
            for (const child of node.children) {
                const slug = this.getFirstSlugInNode(child);
                if (slug) return slug;
            }
        }
        return null;
    }

    animate(direction) {
        this.isAnimating = true;
        const rightEl = document.getElementById('book-right');
        const leftEl = document.getElementById('book-left');

        const outClass = direction > 0 ? 'slide-out-left' : 'slide-out-right';
        const inClass = direction > 0 ? 'slide-in-right' : 'slide-in-left';

        [rightEl, ...(this.isDouble ? [leftEl] : [])].forEach(el => {
            el.classList.add(outClass);
            setTimeout(() => {
                el.classList.remove(outClass);
                el.classList.add(inClass);
                setTimeout(() => {
                    el.classList.remove(inClass);
                    this.isAnimating = false;
                }, 180);
            }, 180);
        });
    }

    async navigateTo(slug) {
        const mdIndex = this.flat.findIndex(p => p.slug === slug);
        if (mdIndex === -1) return;
        this.currentMd = mdIndex;
        this.currentPage = 0;
        await this.loadMd(this.currentMd);
        this.render();
        document.getElementById('toc-dropdown').hidden = true;
    }

    buildTocDropdown() {
        const inner = document.getElementById('toc-dropdown-inner');
        inner.innerHTML = '';

        const renderNode = (node, depth) => {
            const div = document.createElement('div');
            div.className = `chapter toc-depth-${depth}`;

            const title = document.createElement('div');
            title.className = 'chapter-title';
            title.textContent = node.title;
            div.appendChild(title);

            if (node.pages) {
                const ul = document.createElement('ul');
                for (const page of node.pages) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.textContent = page.title;
                    a.dataset.slug = page.slug;
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.navigateTo(page.slug);
                    });
                    li.appendChild(a);
                    ul.appendChild(li);
                }
                div.appendChild(ul);
            }

            if (node.children) {
                for (const child of node.children) {
                    div.appendChild(renderNode(child, depth + 1));
                }
            }

            return div;
        };

        for (const chapter of this.toc) {
            inner.appendChild(renderNode(chapter, 0));
        }
    }

    updateTocActive() {
        const currentSlug = this.flat[this.currentMd]?.slug;
        document.querySelectorAll('.toc-dropdown a').forEach(a => {
            a.classList.toggle('active', a.dataset.slug === currentSlug);
        });
    }

    setupEvents() {
        document.getElementById('nav-prev').addEventListener('click', () => this.navigatePage(-1));
        document.getElementById('nav-next').addEventListener('click', () => this.navigatePage(1));

        const tocBtn = document.getElementById('toc-toggle');
        const tocDropdown = document.getElementById('toc-dropdown');
        tocBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tocDropdown.hidden = !tocDropdown.hidden;
        });
        document.addEventListener('click', () => { tocDropdown.hidden = true; });
        tocDropdown.addEventListener('click', (e) => e.stopPropagation());

        document.getElementById('book-stage').addEventListener('click', (e) => {
            if (e.target.closest('#toc-dropdown')) return;
            if (e.target.closest('.nav-arrow')) return;
            if (e.target.closest('#toc-toggle')) return;
            if (e.target.closest('a')) return;

            this.clickCount++;
            clearTimeout(this.clickTimer);
            this.clickTimer = setTimeout(() => {
                const count = this.clickCount;
                this.clickCount = 0;
                const rect = document.getElementById('book-stage').getBoundingClientRect();
                const direction = e.clientX > rect.left + rect.width / 2 ? 1 : -1;
                if (count === 1) this.navigatePage(direction);
                else if (count === 2) this.navigateMd(direction);
                else if (count >= 3) this.navigateChapter(direction);
            }, 250);
        });

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
                if (count === 1) this.navigatePage(direction);
                else if (count === 2) this.navigateMd(direction);
                else if (count >= 3) this.navigateChapter(direction);
            }, 300);
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
            if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy) || dt > 500) return;
            const direction = dx < 0 ? 1 : -1;
            if (touchCount === 1) this.navigatePage(direction);
            else if (touchCount === 2) this.navigateMd(direction);
            else if (touchCount >= 3) this.navigateChapter(direction);
        }, { passive: true });

        window.addEventListener('resize', async () => {
            const wasDouble = this.isDouble;
            this.updateLayout();
            this.setupHiddenRender();
            this.pages = [];
            await this.loadMd(this.currentMd);
            this.render();
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