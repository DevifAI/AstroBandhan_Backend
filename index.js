// index.js
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";

dotenv.config({ path: ".env" });

connectDB()
  .then(() => {
    console.log("MONGO DB CONNECTION Done !!!00");
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !!!111", err);
  });
