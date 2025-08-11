import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { VerityClient } from "@usherlabs/verity-client";


// Configuration interface
interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  timeout: number;
  proxyTimeout: number;
}

// Default proxy configuration
const defaultConfig: ProxyConfig = {
  target: "https://www.random.org/integers/?num=1&min=1&max=1000000000&col=1&base=10&format=plain",
  changeOrigin: true,
  secure: false,
  logLevel: 'info',
  timeout: 30000,
  proxyTimeout: 30000,
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for proxy
  crossOriginEmbedderPolicy: false, // Disable for proxy
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    proxy: {
      target: defaultConfig.target,
      uptime: process.uptime(),
    },
  });
});

// Proxy configuration endpoint
app.get('/config', (req, res) => {
  res.json({
    proxy: defaultConfig,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
    },
  });
});

// Apply proxy middleware to all routes (transparent proxy)
app.use('/', async (req, res) => {
  try{
    const client = new VerityClient({
      prover_url: 'http://localhost:8080',
      // prover_url: 'https://prover.verity.usher.so',
      // apiKey: process.env.VERITY_API_KEY,
    });

    const request = await client
      .get("https://www.random.org/integers/?num=1&min=1&max=1000000000&col=1&base=10&format=plain").redact("res:header:content-type");

    const payload = {
      data: request.data,
      proof: request.proof,
    }
    console.log(payload);

    res.json(payload);
  }catch(e){
    console.log(e);
    res.status(500).json({
      error: 'Internal Server Error',
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IC Verity Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying requests to: ${defaultConfig.target}`);
  console.log(`🔒 Security headers enabled`);
  console.log(`📊 Logging level: ${defaultConfig.logLevel}`);
  console.log(`⏱️  Timeout: ${defaultConfig.timeout}ms`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/config`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
