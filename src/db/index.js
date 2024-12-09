import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
  dotenv.config({
    path: "../env",
  });

  try {
    // console.log(process.env.MONGODB_URI)
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection Failed", error);
    process.exit(1);
  }
};
export default connectDB;