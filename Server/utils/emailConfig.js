const normalizeEmailPassword = (value = '') => String(value).replace(/\s+/g, '');

module.exports = { normalizeEmailPassword };
