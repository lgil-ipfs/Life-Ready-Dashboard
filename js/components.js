/**
 * Loads header.html and footer.html into their placeholders on every page.
 */
async function loadComponent(elementId, filePath, callback) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Could not fetch ${filePath}`);
        const html = await response.text();
        element.outerHTML = html;
        if (callback) callback();
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-placeholder', 'header.html', () => {
        if (typeof initMobileMenu === 'function') {
            initMobileMenu();
        }
        if (typeof highlightActiveNav === 'function') {
            highlightActiveNav();
        }
        if (typeof initUtilityBar === 'function') {
            initUtilityBar();
        }
        if (typeof initNavSearch === 'function') {
            initNavSearch();
        }
    });
    loadComponent('footer-placeholder', 'footer.html');
});
