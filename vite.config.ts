import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Serves /api/contact in `vite` and `vite preview` so the form works before deploying.
function contactApi(env: Record<string, string>): Plugin {
  const middleware = async (req: any, res: any, next: () => void) => {
    if (!req.url?.startsWith("/api/contact")) return next();
    Object.assign(process.env, env);
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += bytes.length;
      if (length > 20 * 1024) {
        res.statusCode = 413;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Request too large." }));
        return;
      }
      chunks.push(bytes);
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const reply = {
      setHeader: (k: string, v: string) => res.setHeader(k, v),
      status(code: number) {
        res.statusCode = code;
        return this;
      },
      json(data: unknown) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      },
    };
    const { default: handler } = await import("./api/contact.js");
    await handler({ method: req.method, body: raw, headers: req.headers, socket: req.socket }, reply);
  };
  return {
    name: "contact-api",
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), contactApi(loadEnv(mode, process.cwd(), ""))],
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: "index.html",
        privacy: "pages/privacy-policy.html",
        terms: "pages/terms.html",
      },
    },
  },
}));
