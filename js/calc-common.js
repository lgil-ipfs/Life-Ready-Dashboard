/**
 * Shared helpers for the calculator pages: currency formatting, the
 * Life Ready chart palette, and Chart.js defaults.
 */
const fmt = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
const fmtD = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);
const fmtK = (v) => '$' + (Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('en-CA', { maximumFractionDigits: Math.abs(v) < 10000 ? 1 : 0 }) + 'k' : v);
const num = (id) => parseFloat(document.getElementById(id).value) || 0;

const PALETTE = {
    gold: '#D49424',
    goldDark: '#B87F1A',
    goldFill: 'rgba(212, 148, 36, 0.14)',
    charcoal: '#2F2F30',
    charcoalFill: 'rgba(47, 47, 48, 0.08)',
    danger: '#B4472F',
    dangerFill: 'rgba(180, 71, 47, 0.1)',
    muted: '#6B6B6E',
    categorical: ['#D49424', '#2F2F30', '#B4472F', '#8C8C90', '#E3AB4F', '#3D6B4F', '#5E5E62', '#C9B48A', '#A3683A', '#D7D2C8'],
};

if (window.Chart) {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = PALETTE.muted;
    Chart.defaults.plugins.tooltip.backgroundColor = '#2F2F30';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.maintainAspectRatio = true;
}
