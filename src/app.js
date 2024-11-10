import express from "express";
import http from "http";
import cors from "cors";
import errorHandler from "../src/middlewares/error.middleware.js";
import userRouter from "../src/routes/users/user.route.js";
import adminRouter from "../src/routes/admin/admin.route.js";
import astrologerRouter from "../src/routes/astrologer/astrologer.route.js";

// Initialize Express app
const app = express();

// Create HTTP server and attach Express app
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://192.168.31.227:8081", // Set your React app origin
    credentials: true,
  })
);


// Other middleware and route setup
// app.use(rateLimitMiddleware);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));


// Home route
app.get("/", (req, res) => {
  res.send("Welcome To AstroBandhan...");
});


app.use("/astrobandhan/v1/user", userRouter);
app.use("/astrobandhan/v1/admin", adminRouter);
app.use("/astrobandhan/v1/astrologer", astrologerRouter);
// Error handling middleware
app.use(errorHandler);

export { app };

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Astrobandhan is running on http://localhost:${PORT}`);
});