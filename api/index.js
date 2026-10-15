import express from "express";
import { connectedDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const startServer = async () => {
  try {
    await connectedDB();
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