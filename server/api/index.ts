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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain or localhost
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }

    // Allow specific frontend URL from env
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    callback(null, false);
  },
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
    const templateRoutes = (await import('../src/routes/template')).default;

    app.use('/api/auth', authRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/sign', signRoutes);
    app.use('/api/templates', templateRoutes);
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

// Database initialization endpoint (run once to set up schema)
app.get('/init-db', async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = (await import('bcryptjs')).default;
    const prisma = new PrismaClient();

    // Run raw SQL to add columns if they don't exist
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER'`;
    } catch (e) {
      console.log('Role column may already exist or error:', e);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "pdfData" TEXT`;
    } catch (e) {
      console.log('pdfData column may already exist or error:', e);
    }

    // Create super admin if doesn't exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'management@hiredbillingsupport.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Super_admin123', 10);
      await prisma.$executeRaw`INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'management@hiredbillingsupport.com', 'Super Admin', ${hashedPassword}, 'SUPER_ADMIN', NOW(), NOW())`;
      res.json({ success: true, message: 'Database initialized and super admin created' });
    } else {
      // Update existing user to have SUPER_ADMIN role
      await prisma.$executeRaw`UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'management@hiredbillingsupport.com'`;
      res.json({ success: true, message: 'Database initialized, admin already exists' });
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('Init DB error:', error);
    res.status(500).json({ error: 'Failed to initialize database', details: error.message });
  }
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
