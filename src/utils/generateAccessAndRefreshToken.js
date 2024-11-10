import { User } from "../models/user.model.js";
import { ApiResponse } from "./apiResponse.js";


// Generate Access and Refresh Tokens
export const generateAccessAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiResponse(404, null, "User not found");
      }
  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Error generating tokens:", error.message);
      throw new ApiResponse(
        500,
        null,
        "Something went wrong while generating tokens"
      );
    }
  };
  
  