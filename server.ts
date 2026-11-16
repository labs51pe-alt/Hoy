import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthHandler from './api/health.ts';
import registerHandler from './api/register.ts';
import requestOtpHandler from './api/auth/request-otp.ts';
import verifyOtpHandler from './api/auth/verify-otp.ts';
import sessionHandler from './api/auth/session.ts';
import progressHandler from './api/progress.ts';
import adminVerifyHandler from './api/admin/verify.ts';
import adminSubscribersHandler from './api/admin/subscribers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  const wrap =
    (fn: (req: any, res: any) => Promise<any>) =>
    async (req: express.Request, res: express.Response) => {
      try {
        await fn(req, res);
      } catch (err: any) {
        if (!res.headersSent) {
          res.status(500).json({
            ok: false,
            error: err?.message || 'Error interno del servidor',
          });
        }
      }
    };

  // Rutas API compatibilidad 1:1 con Vercel Serverless Functions
  app.all('/api/health', wrap(healthHandler));
  app.all('/api/register', wrap(registerHandler));
  app.all('/api/auth/request-otp', wrap(requestOtpHandler));
  app.all('/api/auth/verify-otp', wrap(verifyOtpHandler));
  app.all('/api/auth/session', wrap(sessionHandler));
  app.all('/api/progress', wrap(progressHandler));
  app.all('/api/admin/verify', wrap(adminVerifyHandler));
  app.all('/api/admin/subscribers', wrap(adminSubscribersHandler));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HOY server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
