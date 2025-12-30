import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'E-Sign API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}
