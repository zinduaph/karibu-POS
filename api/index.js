import express from "express";
import { connectedDB } from "./db/db.js";
import cookieParser from "cookie-parser";
 import dotenv from "dotenv";
 dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello, World!"); 
} ) 
app.listen(PORT , () => {
    connectedDB()
    console.log("server is running on port ", PORT)
})