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
// CORS — shared instance used for BOTH preflight + requests
// ======================================================

const corsOptions = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.railway.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
});

// Preflight must come FIRST (before auth or any other middleware)
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
  console.log('[' + req.method + '] ' + req.originalUrl + ' | Origin: ' + (req.headers.origin || 'No Origin'));
  next();
});

// ======================================================
// HEALTH CHECKS
// ======================================================

app.get('/', (req, res) => res.status(200).send('PowerBill API Running'));
app.get('/health', (req, res) => res.status(200).send('OK'));

// ======================================================
// API ROUTES
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
console.log('[SERVER] API routes loaded');

// ======================================================
// SOCKET.IO
// ======================================================

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed =
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.endsWith('.railway.app');
      isAllowed ? callback(null, true) : callback(new Error('Socket CORS blocked'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);
  socket.on('disconnect', () => console.log('[Socket] Disconnected:', socket.id));
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found: ' + req.originalUrl });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  const isCors = err.message === 'Not allowed by CORS';
  const status = isCors ? 403 : 500;
  console.error('[' + (isCors ? 'CORS' : 'SERVER') + ' ERROR]', err.message);
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('[SERVER] Running on port ' + PORT);
  // init() is NOT async — it just schedules polling internally
  modbusEngine.init(io);
});