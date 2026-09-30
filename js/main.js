/**
 * Site behaviour. All content and navigation are in the static HTML, so
 * everything here is progressive enhancement: the site works without it.
 */

/** Mobile hamburger menu. */
function initMobileMenu() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('nav-overlay');
    if (!toggle || !navLinks) return;

    function setOpen(open) {
        toggle.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        if (overlay) overlay.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', () => setOpen(!navLinks.classList.contains('active')));
    if (overlay) overlay.addEventListener('click', () => setOpen(false));
    navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
    });
}

/**
 * Dismissible gold utility bar at the very top of the header.
 * Stays dismissed for the rest of the browser session once closed.
 */
function initUtilityBar() {
    const bar = document.getElementById('utility-bar');
    const closeBtn = document.getElementById('utility-bar-close');
    if (!bar || !closeBtn) return;

    const key = 'lifeready-utility-bar-dismissed';
    try {
        if (sessionStorage.getItem(key) === 'true') {
            bar.style.display = 'none';
            return;
        }
    } catch (e) { /* storage unavailable */ }

    closeBtn.addEventListener('click', () => {
        bar.style.display = 'none';
        try { sessionStorage.setItem(key, 'true'); } catch (e) { /* storage unavailable */ }
    });
}

/** Keeps the header search box filled with the current ?q= query. */
function initNavSearch() {
    const input = document.getElementById('nav-search-input');
    const query = new URLSearchParams(window.location.search).get('q');
    if (input && query) input.value = query;
}

/**
 * Education library filtering: topic pills, #topic deep links, and a text
 * search driven by the header search box (?q= in the URL).
 */
function initLibraryFilters() {
    const filters = document.querySelectorAll('.category-filter');
    const groups = document.querySelectorAll('.category-group');
    const noResults = document.getElementById('no-results');
    if (!groups.length) return;

    function setActiveFilter(value) {
        filters.forEach((f) => {
            const active = f.dataset.filter === value;
            f.classList.toggle('active', active);
            f.setAttribute('aria-pressed', String(active));
        });
    }

    function showByCategory(selected) {
        setActiveFilter(selected);
        groups.forEach((group) => {
            group.hidden = !(selected === 'all' || group.dataset.category === selected);
            group.querySelectorAll('.resource-card').forEach((card) => { card.hidden = false; });
        });
        if (noResults) noResults.classList.remove('active');
    }

    function filterByQuery(query) {
        const q = query.trim().toLowerCase();
        let anyVisible = false;
        setActiveFilter('all');
        groups.forEach((group) => {
            const groupText = group.querySelector('h2').textContent.toLowerCase();
            let groupHasMatch = false;
            group.querySelectorAll('.resource-card').forEach((card) => {
                const matches = groupText.includes(q) || card.textContent.toLowerCase().includes(q);
                card.hidden = !matches;
                if (matches) groupHasMatch = true;
            });
            group.hidden = !groupHasMatch;
            if (groupHasMatch) anyVisible = true;
        });
        if (noResults) noResults.classList.toggle('active', !anyVisible);
    }

    filters.forEach((filter) => {
        filter.addEventListener('click', () => {
            showByCategory(filter.dataset.filter);
            const hash = filter.dataset.filter === 'all' ? '' : '#' + filter.dataset.filter;
            history.replaceState(null, '', window.location.pathname + hash);
        });
    });

    const query = new URLSearchParams(window.location.search).get('q');
    const hash = window.location.hash.slice(1);
    if (query) {
        filterByQuery(query);
    } else if (hash && document.querySelector(`.category-group[data-category="${CSS.escape(hash)}"]`)) {
        showByCategory(hash);
    }
}

/** Click-to-play YouTube embeds, so nothing from YouTube loads until asked. */
function initVideoEmbeds() {
    document.querySelectorAll('.video-embed[data-youtube-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.youtubeId)}?autoplay=1&rel=0`;
            iframe.title = button.getAttribute('aria-label').replace(/^Play video: /, '');
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.className = 'video-embed';
            button.replaceWith(iframe);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initUtilityBar();
    initNavSearch();
    initLibraryFilters();
    initVideoEmbeds();
});
