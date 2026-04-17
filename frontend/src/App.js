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
      <header className="app-header">
        <h1>Three-Tier Azure GitOps App</h1>
        <span className={`health-badge ${health?.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
          {health?.status || 'checking...'}
        </span>
      </header>

      <main>
        <form onSubmit={addItem} className="add-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter item name"
            required
          />
          <button type="submit">Add Item</button>
        </form>

        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <small>{new Date(item.created_at).toLocaleString()}</small>
              <button onClick={() => deleteItem(item.id)} className="delete-btn">✕</button>
            </li>
          ))}
          {items.length === 0 && <li className="empty">No items yet. Add one above!</li>}
        </ul>
      </main>
    </div>
  );
}

export default App;
