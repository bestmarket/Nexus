/**
 * Full-Stack Server Entry Point
 * Runs Express backend with Vite middlewares mounted in dev ("dev": "tsx server.ts")
 * Serving both /api routes and Vite SPA on port 3000.
 */
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app as apiApp } from './src/server/app';

const PORT = 3000;

async function bootstrap() {
  const app = express();

  // Mount Express API Gateway
  app.use(apiApp);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev mode, mount Vite dev server as middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NexusPulse Server] Live at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('[NexusPulse Bootstrap Failed]:', err);
});
