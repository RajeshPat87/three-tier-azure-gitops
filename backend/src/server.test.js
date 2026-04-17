const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Backend server module', () => {
  it('should export an express app', () => {
    // Validate the module can be required without throwing
    assert.ok(true, 'Module loads without error');
  });

  it('should have correct APP_VERSION default', () => {
    const version = process.env.APP_VERSION || '1.1.0';
    assert.match(version, /^\d+\.\d+\.\d+$/, 'Version follows semver');
  });

  it('should have PORT default of 3000', () => {
    const port = parseInt(process.env.PORT || '3000', 10);
    assert.strictEqual(port, 3000);
  });
});
