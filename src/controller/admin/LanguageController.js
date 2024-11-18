import {Language} from '../../models/language.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { capitalizeLanguageName } from '../../utils/assistingFunction.js';
import { asyncHandler } from '../../utils/asyncHandler.js';


// Create a new language
export const createLanguage = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Language name is required'));
  }

  // Capitalize the language name before inserting
  const formattedName = capitalizeLanguageName(name);

  // Check if the language already exists (case insensitive check)
  const existingLanguage = await Language.findOne({
    name: { $regex: new RegExp(`^${formattedName}$`, 'i') },
  });

  if (existingLanguage) {
    return res
      .status(409)
      .json(new ApiResponse(409, null, 'Language already exists'));
  }

  const language = new Language({ name: formattedName });
  await language.save();

  return res
    .status(201)
    .json(new ApiResponse(201, language, 'Language created successfully'));
});

// Delete a language by ID
export const deleteLanguage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const language = await Language.findByIdAndDelete(id);
  if (!language) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, 'Language not found'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Language deleted successfully'));
});

// Controller to get all languages
export const getAllLanguages = asyncHandler(async (req, res) => {
  try {
    // Fetch all languages from the database
    const languages = await Language.find();

    // If no languages found, return a message
    if (languages.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'No languages found'));
    }

    // Return the list of languages
    return res
      .status(200)
      .json(new ApiResponse(200, languages, 'Languages retrieved successfully'));
  } catch (error) {
    console.error("Error fetching languages:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'An error occurred while fetching languages'));
  }
});
