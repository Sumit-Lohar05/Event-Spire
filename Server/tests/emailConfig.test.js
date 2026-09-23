const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeEmailPassword } = require('../utils/emailConfig');

test('normalizeEmailPassword removes spaces from Gmail app passwords', () => {
  assert.equal(normalizeEmailPassword(' smmv frlq ldbt ouip '), 'smmvfrlqldbtouip');
});
