import { Language } from "../models/language.model.js";

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