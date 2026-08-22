import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import societyRoutes from './routes/societyRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

const allowedOrigins = [
  'https://frontend-mocha-sigma-35.vercel.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/societies', societyRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);

export default app;
