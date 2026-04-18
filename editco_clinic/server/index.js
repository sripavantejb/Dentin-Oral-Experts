import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Submission } from "./models/Submission.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

// Connection state caching
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("Connected to MongoDB via Serverless Wrapper");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

app.post("/api/contact", async (req, res) => {
  try {
    await connectToDatabase();
    const { name, phone, email, service, date, time } = req.body;
    
    // Simple validation
    if (!name || !phone || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSubmission = new Submission({
      name, phone, email, service, date, time
    });

    await newSubmission.save();

    console.log("New submission saved for", name);

    // Note: Email sending is skipped for now, will implement Data saving & Admin UI first

    res.status(201).json({ message: "Submission created successfully", success: true });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/submissions", async (req, res) => {
  try {
    await connectToDatabase();
    // Sort by newest first
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Express API running on port ${PORT}`);
  });
}

export default app;
