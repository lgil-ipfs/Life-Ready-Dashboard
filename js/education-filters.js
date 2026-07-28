/**
 * Category filter pills on the Education Hub. The video library group
 * always stays visible since its videos aren't tagged per-category yet.
 */
document.addEventListener('DOMContentLoaded', () => {
    const filters = document.querySelectorAll('.category-filter');
    const groups = document.querySelectorAll('.category-group');
    if (!filters.length || !groups.length) return;

    filters.forEach((filter) => {
        filter.addEventListener('click', () => {
            filters.forEach((f) => f.classList.remove('active'));
            filter.classList.add('active');

            const selected = filter.dataset.filter;

            groups.forEach((group) => {
                const category = group.dataset.category;
                const shouldShow =
                    selected === 'all' || category === selected || category === 'videos';
                group.style.display = shouldShow ? '' : 'none';
            });
        });
    });
});
