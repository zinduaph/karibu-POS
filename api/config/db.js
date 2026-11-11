import mongoose from "mongoose";

export const connectedDB = async () => {
  mongoose.connection.on('connected', () => {
        console.log('mongoDB connected')
    })

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  const conn = await mongoose.connect(`${process.env.MONGO_URI}/phone-pos`)
  console.log("MongoDB connected:", conn.connection.host, "database:", conn.connection.name);
};