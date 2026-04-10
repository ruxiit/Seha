import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import prescriptionRoutes from './routes/prescription.routes';
import patientRoutes from './routes/patient.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' })); // prescriptions may include large RSA blobs
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/admin',         adminRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', env: process.env.NODE_ENV, time: new Date().toISOString() })
);

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler (must be last)
app.use(errorHandler);

export default app;