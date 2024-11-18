// index.js
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";


dotenv.config({
  path: "../env",
});




connectDB()
  .then(() => {
    console.log("MONGO DB CONNECTION DOne !!!");
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !!!", err);
  });
