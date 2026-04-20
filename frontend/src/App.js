import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchHealth();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'unhealthy' });
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setName('');
      fetchItems();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="app">
      <div className="version-banner">
        🚀 v2.0 — Deployed via ArgoCD GitOps | Last updated: {new Date().toLocaleDateString()}
      </div>

      <header className="app-header">
        <div className="header-left">
          <h1>☁️ Three-Tier Azure GitOps</h1>
          <p className="subtitle">React • Node.js • PostgreSQL on AKS</p>
        </div>
        <span className={`health-badge ${health?.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
          ● {health?.status || 'checking...'}
        </span>
      </header>

      <main>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat">
            <span className="stat-value">{health?.status === 'healthy' ? '✅' : '❌'}</span>
            <span className="stat-label">API Health</span>
          </div>
          <div className="stat">
            <span className="stat-value">🗄️</span>
            <span className="stat-label">PostgreSQL</span>
          </div>
        </div>

        <form onSubmit={addItem} className="add-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="✏️ Enter item name..."
            required
          />
          <button type="submit">+ Add Item</button>
        </form>

        <ul className="item-list">
          {items.map((item, index) => (
            <li key={item.id}>
              <span className="item-number">#{index + 1}</span>
              <span className="item-name">{item.name}</span>
              <small>{new Date(item.created_at).toLocaleString()}</small>
              <button onClick={() => deleteItem(item.id)} className="delete-btn" title="Delete">🗑️</button>
            </li>
          ))}
          {items.length === 0 && <li className="empty">📭 No items yet. Add one above!</li>}
        </ul>
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ using Azure DevOps + ArgoCD GitOps</p>
      </footer>
    </div>
  );
}

export default App;
