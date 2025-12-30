import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy load routes to catch import errors
let routesLoaded = false;
let loadError: Error | null = null;

const loadRoutes = async () => {
  if (routesLoaded) return;
  try {
    const authRoutes = (await import('../src/routes/auth')).default;
    const documentRoutes = (await import('../src/routes/documents')).default;
    const signRoutes = (await import('../src/routes/sign')).default;

    app.use('/api/auth', authRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/sign', signRoutes);
    routesLoaded = true;
  } catch (err) {
    loadError = err as Error;
    console.error('Failed to load routes:', err);
  }
};

// Initialize routes
loadRoutes();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    routesLoaded,
    loadError: loadError?.message
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'E-Sign API Server',
    status: 'running',
    routesLoaded,
    loadError: loadError?.message
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export for Vercel serverless
export default app;
