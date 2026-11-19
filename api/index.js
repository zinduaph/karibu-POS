import './loadEnv.js';
import express from "express";
import { connectedDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import hotelDetailsRoutes from "./routes/hotelDetails.routes.js";
import billingRoutes from './routes/billingRoutes.js';
import devRoutes, { monitorRequests } from './controllers/devcontroller.js';
import { billingSweep } from './services/billing.service.js';
import cookieParser from "cookie-parser";
const requiredEnvironment = ['MONGO_URI', 'ACCESS_TOKEN', 'PIN_PEPPER'];
const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingEnvironment.length > 0) {
  console.error(
    `API configuration error: missing required environment variable(s): ${missingEnvironment.join(', ')}. ` +
      'Set them in the repository-root .env file, then restart the API.',
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = new Set(
  (process.env.ADMIN_ORIGINS || process.env.ADMIN_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(monitorRequests);
app.use('/api/billing', billingRoutes);
app.use('/api/dev', devRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth/onboarding", onboardingRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/products/hotel-details", hotelDetailsRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const startServer = async () => {
  try {
    await connectedDB();
    setInterval(
      () => billingSweep().catch((err) => console.error('billing sweep failed:', err.message)),
      10 * 60e3,
    );
    app.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
  } catch (err) {
    console.error(
      "API startup failed. Verify MongoDB is running and MONGO_URI points to the correct instance:",
      err.message
    );
    process.exitCode = 1;
  }
};

startServer();