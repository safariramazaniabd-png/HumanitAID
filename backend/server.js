require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const { helmetConfig, generalLimiter } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const mediaRoutes = require('./routes/media');
const slidesRoutes = require('./routes/slides');
const causesRoutes = require('./routes/causes');
const testimonialsRoutes = require('./routes/testimonials');
const newsRoutes = require('./routes/news');
const donationsRoutes = require('./routes/donations');
const settingsRoutes = require('./routes/settings');
const usersRoutes = require('./routes/users');
const webhooksRoutes = require('./routes/webhooks');
const configRoutes = require('./routes/config');

const app = express();

app.use(helmetConfig);

const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin non autorisée'));
    }
  },
  credentials: true,
}));

app.use(generalLimiter);

// Mounted before express.json: webhooks need the RAW body for signature validation.
app.use('/api/webhooks', webhooksRoutes);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/causes', causesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/config', configRoutes);

const { query } = require('./config/database');

app.get('/api/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: env.nodeEnv,
    demoMode: env.demoMode,
  };

  if (!env.demoMode) {
    try {
      await query('SELECT 1');
      health.database = 'connected';
    } catch (err) {
      health.status = 'degraded';
      health.database = 'disconnected';
    }
  } else {
    health.database = 'mock';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err, _req, res, _next) => {
  console.error('[Server] Erreur non gérée:', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux' });
  }
  if (err.message === 'Origin non autorisée') {
    return res.status(403).json({ error: 'Origin non autorisée' });
  }
  res.status(500).json({ error: 'Erreur serveur interne' });
});

require('./services/bootstrapAdmin')
  .ensureAdmin()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`[Server] HumanitAID API — http://localhost:${env.port}`);
      console.log(`[Server] Env: ${env.nodeEnv} | Demo: ${env.demoMode}`);
      console.log(`[Server] CORS: ${env.corsOrigin}`);
    });
  })
  .catch((err) => {
    console.error('[Server] Échec du démarrage:', err.message);
    process.exit(1);
  });
