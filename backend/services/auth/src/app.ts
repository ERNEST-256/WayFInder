import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env";


const app = express();

app.use(express.json({"limit": "30kb"}));
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
    origin: env.ORIGIN,
    credentials: true,
    methods : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],

}))

app.get("/health" , (_req, res) => {
     res.status(200).json({ status: "ok", service : "auth" });
})

export default app;