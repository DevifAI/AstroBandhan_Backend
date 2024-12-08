import { Language } from "../models/language.model.js";
import { randomBytes } from "crypto";
// Capitalize the first letter of each word (for consistent convention)
export const capitalizeLanguageName = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getDefaultLanguageId = async () => {
  const language = await Language.findOne({ name: 'English' });
  return language ? language._id : null; // Fallback if no English language found
};



// Function to generate a random 16-character string
export const generateChatRoomId = () => {
    return randomBytes(8).toString('hex');  // Generates 16 characters (8 bytes * 2 hex chars per byte)
};
