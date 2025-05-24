import express from "express";
import http from "http";
import cors from "cors";
import errorHandler from "../src/middlewares/error.middleware.js";
import { initializeAgenda } from "./utils/call/agenda.js"; // <-- Import initializeAgenda here

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Welcome To AstroBandhan...");
});

// Import routes
import userRouter from "../src/routes/users/user.route.js";
import adminRouter from "../src/routes/admin/admin.route.js";
import astrologerRouter from "../src/routes/astrologer/astrologer.route.js";
import productCategoryRoutes from "../src/routes/product/productcategory.routes.js";
import productRoutes from "../src/routes/product/product.routes.js";
import orderRoutes from "../src/routes/product/order.routes.js";
import { setupSocketIO } from "./utils/sockets/socketTow.js";

// API routes
app.use("/astrobandhan/v1/user", userRouter);
app.use("/astrobandhan/v1/admin", adminRouter);
app.use("/astrobandhan/v1/astrologer", astrologerRouter);
app.use("/astrobandhan/v1/productCategory", productCategoryRoutes);
app.use("/astrobandhan/v1/product", productRoutes);
app.use("/astrobandhan/v1/order", orderRoutes);

app.use(errorHandler);

const server = http.createServer(app);
setupSocketIO(server);

const PORT = 8000;

(async () => {
  try {
    await initializeAgenda(); // <-- Initialize Agenda here before starting the server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`AstroBandhan is running on http://localhost:${PORT}`);
      console.log(`WebSocket server is running at: ws://localhost:${PORT}`);
      // const localIp = "192.168.31.156";
      // const wsUrl = `ws://${localIp}:${PORT}`;
      // console.log(`AstroBandhan is running on http://${localIp}:${PORT}`);
      // console.log(`WebSocket server is running at: ${wsUrl}`);
    });
  } catch (error) {
    console.error("Failed to initialize Agenda:", error);
    process.exit(1);
  }
})();

export { app };
