import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import binsRouter from './routes/bins.js';
import sensorsRouter from './routes/sensors.js';
import alertsRouter from './routes/alerts.js';
import devicesRouter from './routes/devices.js';
import collectionsRouter from './routes/collections.js';
import analyticsRouter from './routes/analytics.js';
import settingsRouter from './routes/settings.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import { eventStream } from './services/eventStream.js';
import { offlineWatchdog } from './services/offlineWatchdog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Municipal Solid Waste IoT Telemetry Gateway',
    timestamp: new Date().toISOString(),
    sseClientsConnected: eventStream.getConnectedCount()
  });
});

// SSE endpoint for live updates
app.get('/api/v1/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  eventStream.addClient(clientId, res);
});

// Mount modular API routers
app.use('/api/v1/bins', binsRouter);
app.use('/api/v1/sensors', sensorsRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/collections', collectionsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);

// Start IoT Offline Watchdog (checks every 30s for inactive sensor nodes)
offlineWatchdog.start(30000);

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Municipal Waste Segregation Backend Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ SSE Event Stream: http://localhost:${PORT}/api/v1/events`);
  console.log(`🛡️ IoT Ingestion Endpoint: http://localhost:${PORT}/api/v1/sensors/reading`);
  console.log(`=======================================================`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  offlineWatchdog.stop();
  server.close(() => process.exit(0));
});
