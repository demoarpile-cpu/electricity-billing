const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env FIRST
dotenv.config();

const modbusEngine = require('./services/modbusEngine');
const authRoutes = require('./routes/auth.routes');
const consumerRoutes = require('./routes/consumer.routes');
const billRoutes = require('./routes/bill.routes');
const paymentRoutes = require('./routes/payment.routes');
const complaintRoutes = require('./routes/complaint.routes');
const settingRoutes = require('./routes/setting.routes');
const operatorRoutes = require('./routes/operator.routes');
const notificationRoutes = require('./routes/notification.routes');
const meterRoutes = require('./routes/meter.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();
const server = http.createServer(app);

// ======================================================
// ALLOWED ORIGINS
// ======================================================

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://electricity-billing.kiaantechnology.com',
  'https://electricity-billing-production.up.railway.app',
  'https://electricity-billing-production-4c58.up.railway.app'
];

// ======================================================
// CORS
// ======================================================

const corsOptions = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.railway.app');

    isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
});

app.options('*', corsOptions);
app.use(corsOptions);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/', (req, res) => res.status(200).send('PowerBill API Running'));
app.get('/health', (req, res) => res.status(200).send('OK'));

// ======================================================
// ROUTES
// ======================================================

const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/consumers', consumerRoutes);
apiRouter.use('/bills', billRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/settings', settingRoutes);
apiRouter.use('/operator', operatorRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/meters', meterRoutes);
apiRouter.use('/reports', reportRoutes);

app.use('/api', apiRouter);

// ======================================================
// SOCKET.IO
// ======================================================

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);
  socket.on('disconnect', () => console.log('[Socket] Disconnected:', socket.id));
});

// ======================================================
// 404
// ======================================================

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${PORT}`);

  // 🔥 SAFE MODBUS INIT (IMPORTANT FIX)
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[MODBUS] Starting locally...');
      modbusEngine.init(io);
    } catch (err) {
      console.error('[MODBUS ERROR]', err.message);
    }
  } else {
    console.log('[MODBUS] Skipped in production (Railway)');
  }
});
