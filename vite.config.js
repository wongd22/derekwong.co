import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function spendingDevApi() {
  return {
    name: 'spending-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] || '';
        if (path.startsWith('/api/shopping')) {
          try {
            const mod = await server.ssrLoadModule('/server/shopping/preview.js');
            await mod.handlePreview(req, res);
          } catch (error) {
            console.error(error);
            if (!res.headersSent) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ title: '', image: '' }));
            }
          }
          return;
        }
        if (!path.startsWith('/api/spending')) return next();
        try {
          const mod = await server.ssrLoadModule('/server/spending/handler.js');
          const handled = await mod.routeSpending(req, res);
          if (!handled) next();
        } catch (error) {
          console.error(error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Spending API failed.' }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), spendingDevApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})