/**
 * Header search box. Submitting from any page sends the query to the
 * Education Hub, which reads it back out of the URL and filters resources.
 */
function initNavSearch() {
    const form = document.getElementById('nav-search-form');
    const input = document.getElementById('nav-search-input');
    if (!form || !input) return;

    const params = new URLSearchParams(window.location.search);
    const existingQuery = params.get('q');
    if (existingQuery) input.value = existingQuery;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = input.value.trim();
        const target = 'education.html' + (query ? `?q=${encodeURIComponent(query)}` : '');
        window.location.href = target;
    });
}
