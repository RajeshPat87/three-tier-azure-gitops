import React from 'react';

// Basic smoke test – verifies the module can be imported
describe('App component', () => {
  it('should be importable without errors', () => {
    const App = require('./App');
    expect(App).toBeDefined();
  });
});
