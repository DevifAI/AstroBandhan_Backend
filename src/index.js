// index.js
import fs from "fs";
import https from "https";
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";


dotenv.config({
  path: "../env",
});

const options = {
  key: fs.readFileSync("/etc/ssl/private/selfsigned.key"),
  cert: fs.readFileSync("/etc/ssl/private/selfsigned.crt"),
};



connectDB()
  .then(() => {
    console.log("MONGO DB CONNECTION Done !!!");

    // Create HTTPS server
    https
      .createServer(options, app)
      .listen(process.env.PORT, () => {
        console.log(`Server running on https://localhost:${process.env.PORT}`);
      });
  })
  .catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !!!", err);
  });
