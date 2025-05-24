// index.js
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { startServer } from "./src/app.js"; // import a function to start your server
dotenv.config({ path: ".env" });

connectDB()
  .then(() => {
    console.log("MONGO DB CONNECTION Done !!!00");
    // Start the server after DB connection is ready
    startServer();
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !!!111", err);
  });
