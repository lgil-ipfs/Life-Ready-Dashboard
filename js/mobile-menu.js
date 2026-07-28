/**
 * Mobile hamburger menu toggle, wired up after header.html loads.
 */
function initMobileMenu() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('nav-overlay');
    if (!toggle || !navLinks) return;

    function closeMenu() {
        toggle.classList.remove('active');
        navLinks.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        toggle.classList.add('active');
        navLinks.classList.add('active');
        if (overlay) overlay.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', () => {
        const isActive = navLinks.classList.contains('active');
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });
}

/**
 * Highlights the nav link matching the current page in the header.
 */
function highlightActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
        const href = link.getAttribute('href');
        if (href === current) {
            link.classList.add('active');
        }
    });
}
