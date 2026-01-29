/**
 * @fileoverview Prometheus metrics middleware for Express
 * @description Exposes HTTP metrics at /metrics for Prometheus
 */

const client = require('prom-client');

// Create registry
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

/**
 * Middleware that records metrics for each request
 */
const metricsMiddleware = (req, res, next) => {
  // Ignore /metrics route
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;

    // Normalize route to avoid high cardinality
    const route = req.route?.path || req.path.replace(/\/[a-f0-9]{24}/g, '/:id');

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );
  });

  next();
};

/**
 * Handler para exponer métricas en /metrics
 */
const metricsHandler = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
};

module.exports = { metricsMiddleware, metricsHandler };
