/**
 * Dismissible gold utility bar at the very top of the header.
 * Stays dismissed for the rest of the browser session once closed.
 */
function initUtilityBar() {
    const bar = document.getElementById('utility-bar');
    const closeBtn = document.getElementById('utility-bar-close');
    if (!bar || !closeBtn) return;

    if (sessionStorage.getItem('lifeready-utility-bar-dismissed') === 'true') {
        bar.style.display = 'none';
        return;
    }

    closeBtn.addEventListener('click', () => {
        bar.style.display = 'none';
        sessionStorage.setItem('lifeready-utility-bar-dismissed', 'true');
    });
}
