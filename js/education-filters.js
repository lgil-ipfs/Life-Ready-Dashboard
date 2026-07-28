/**
 * Education Hub filtering: category pills, and a text search driven by
 * the header search box (?q= in the URL). The video library group always
 * stays visible under category filters since its videos aren't tagged
 * per-category yet, but it's hidden during a text search since none of
 * its titles can match.
 */
document.addEventListener('DOMContentLoaded', () => {
    const filters = document.querySelectorAll('.category-filter');
    const groups = document.querySelectorAll('.category-group');
    const noResults = document.getElementById('no-results');
    if (!groups.length) return;

    function showByCategory(selected) {
        groups.forEach((group) => {
            const category = group.dataset.category;
            const shouldShow =
                selected === 'all' || category === selected || category === 'videos';
            group.style.display = shouldShow ? '' : 'none';
            group.querySelectorAll('.resource-card').forEach((card) => {
                card.style.display = '';
            });
        });
        if (noResults) noResults.classList.remove('active');
    }

    function filterByQuery(query) {
        const q = query.trim().toLowerCase();
        let anyVisible = false;

        groups.forEach((group) => {
            if (group.dataset.category === 'videos') {
                group.style.display = 'none';
                return;
            }

            let groupHasMatch = false;
            group.querySelectorAll('.resource-card').forEach((card) => {
                const text = card.textContent.toLowerCase();
                const matches = text.includes(q);
                card.style.display = matches ? '' : 'none';
                if (matches) groupHasMatch = true;
            });

            group.style.display = groupHasMatch ? '' : 'none';
            if (groupHasMatch) anyVisible = true;
        });

        if (noResults) noResults.classList.toggle('active', !anyVisible);
    }

    if (filters.length) {
        filters.forEach((filter) => {
            filter.addEventListener('click', () => {
                filters.forEach((f) => f.classList.remove('active'));
                filter.classList.add('active');
                showByCategory(filter.dataset.filter);
            });
        });
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
        filterByQuery(query);
    }
});
