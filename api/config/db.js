import mongoose from "mongoose";

export const connectedDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  const conn = await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || "karibu_pos",
  });
  console.log("MongoDB connected:", conn.connection.host, "database:", conn.connection.name);
};