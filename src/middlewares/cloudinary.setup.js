import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload fileon cloud
console.log("t")
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: 'astrologer-avatars',
    });
   
    return response;

  } catch (error) {
  }
};

export { uploadOnCloudinary };