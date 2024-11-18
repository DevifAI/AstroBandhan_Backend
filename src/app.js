import express from "express";
import http from "http";
import cors from "cors";
import errorHandler from "../src/middlewares/error.middleware.js";
import userRouter from "../src/routes/users/user.route.js";
import adminRouter from "../src/routes/admin/admin.route.js";
import astrologerRouter from "../src/routes/astrologer/astrologer.route.js";
import { Server } from "socket.io";
import { initSocket } from "./utils/sockets/socket.js";

// Initialize Express app
const app = express();

// CORS configuration
app.use(cors());

// Other middleware and route setup
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
  res.send("Welcome To AstroBandhan...");
});

// API routes
app.use("/astrobandhan/v1/user", userRouter);
app.use("/astrobandhan/v1/admin", adminRouter);
app.use("/astrobandhan/v1/astrologer", astrologerRouter);

// Error handling middleware
app.use(errorHandler);

// Create the HTTP server
const server = http.createServer(app);


// Initialize socket
initSocket(server);  // This initializes the socket.io server


// Start the server on port 6000
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`AstroBandhan is running on http://localhost:${PORT}`);
});

export { app};
