import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
}
