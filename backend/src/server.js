const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || '1.1.0';
const startTime = Date.now();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Liveness probe — lightweight, no DB dependency
app.get('/api/livez', (_req, res) => {
  res.json({ status: 'alive', uptime: Math.floor((Date.now() - startTime) / 1000) });
});

// Readiness probe — checks DB connectivity
app.get('/api/readyz', async (_req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latencyMs = Date.now() - start;
    res.json({ status: 'ready', db: 'connected', latencyMs });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', db: 'disconnected', error: err.message });
  }
});

// Combined health endpoint (backward-compat + version info)
app.get('/api/health', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latencyMs = Date.now() - start;
    res.json({
      status: 'healthy',
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      db: { connected: true, latencyMs },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', version: APP_VERSION, error: err.message });
  }
});

// List items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create item
app.post('/api/items', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API v${APP_VERSION} running on port ${PORT}`);
});

// Graceful shutdown — drain connections on SIGTERM (K8s pod termination)
const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    pool.end().then(() => {
      console.log('DB pool closed');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
