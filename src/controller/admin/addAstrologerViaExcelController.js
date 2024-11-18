import xlsx from 'xlsx';
import { Astrologer } from '../../models/astrologer.model.js'; // Import your Astrologer model
import fs from "fs";
import { Language } from '../../models/language.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';


// Define your expected headers (schema fields)
const expectedHeaders = ['name', 'gender', 'phone', 'experience', 'specialities', 'pricePerCallMinute', 'pricePerChatMinute', 'password', "languages"];

// Controller to handle the upload and process Excel file
export const uploadAstrologerData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(req.file)
        // Parse the Excel file from the buffer
        const fileBuffer = fs.readFileSync(req.file.path);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

        // Loop through all sheets in the workbook
        async function getLanguageIds(names) {
            const languages = await Language.find({ name: { $in: names } });
            return languages.map(lang => lang._id);
        }

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet to JSON (rows)
            const rows = xlsx.utils.sheet_to_json(worksheet);

            if (rows.length > 0) {
                // Get headers from the first row of data (keys)
                const headers = Object.keys(rows[0]);
                console.log({ headers })
                // Check if headers match the expected schema
                const isValid = expectedHeaders.every((header) => headers.includes(header));

                if (isValid) {
                    // Insert rows into the database for this sheet
                    for (const row of rows) {
                        const languageNames = row.languages ? row.languages.split(',') : [];
                        const languageIds = await getLanguageIds(languageNames); // Get language IDs
                        const astrologerData = {
                            name: row.name,
                            experience: row.experience,
                            specialities: row.specialities ? row.specialities.split(',') : [],
                            pricePerCallMinute: row.pricePerCallMinute,
                            pricePerChatMinute: row.pricePerChatMinute,
                            gender: row.gender,
                            password: row.password,
                            phone: row.phone,
                            languages: languageIds // Set languages as an array of ObjectIds


                        };

                        // Insert the astrologer data into the database
                        await Astrologer.create(astrologerData);
                    }

                    fs.unlinkSync(req?.file?.path);


                    return res.status(200).json(new ApiResponse(200, {}, "Excel sheet  uploaded successfully."));
                } else {
                    return res.status(200).json(new ApiResponse(400, {}, "Invalid headers in sheet ${sheetName}"));
                }
            }
        }
        return res.status(400).json(new ApiResponse(400, {}, "No valid sheets found"));
    } catch (error) {
        console.error(error);
        return res.status(400).json(new ApiResponse(400, {}, "Server Error"));
    }
};
