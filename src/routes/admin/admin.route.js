import express from 'express';
import { createLanguage, deleteLanguage, } from '../../controller/admin/LanguageController.js';
import { registerAstrologer } from '../../controller/admin/addAstrologerController.js';
import { editProfilePhoto } from '../../controller/admin/editAstrologerProfilePhoto.js';
import { uploadAstrologerData } from '../../controller/admin/addAstrologerViaExcelController.js';;
import { upload } from '../../middlewares/multer.middlewre.js';
import { findAstrologerByVerified } from '../../controller/admin/findAstrologerByVerified.js';
import { updateAstrologerFields } from '../../controller/admin/updateAstrologerFields.js';
import { getAstrologers } from '../../controller/admin/findAstrologerBy_id_name_specialities.js';
import { addAstrologerToCategory, addCategory, deleteAstrologerFromCategory, deleteCategory, getAstrologersByCategoryName } from '../../controller/admin/AstrologerCategory.js';
import { getPendingAstrologerRequests } from '../../controller/admin/getPendingAstrologerRequest.js'
import { addAstrologer, editAstrologer,deleteAstrologer } from '../../controller/admin/ai_astrologerController.js';
const router = express.Router();

// Route to create a language
router.post('/add/language', createLanguage);
// Route to delete a language by ID
router.delete('/language/:id', deleteLanguage);
router.post('/signup/astrologer', registerAstrologer);
router.put('/editprofilephoto/astrologer/:astrologerId', upload.single('avatar'), editProfilePhoto)

// Use the multer middleware in the route
router.post('/signup/astrologer/excel', upload.single('excel_astrologer'), uploadAstrologerData);

router.post('/astrologers/find-by-verified', findAstrologerByVerified);
router.post('/astrologer/update', updateAstrologerFields);
router.post('/getastrologers', getAstrologers);
router.post('/add/category', addCategory);
router.post('/delete/category/:categoryId',);
router.delete('/delete/category/:categoryId', deleteCategory);
router.post('/add/astrologer/category', addAstrologerToCategory);
router.delete('/delete/astrologer/category', deleteAstrologerFromCategory);
router.get('/astrologers/by-category/:categoryName', getAstrologersByCategoryName);
router.get('/pending-astrologer-requests', getPendingAstrologerRequests);

//need to check all this api, in progress
router.post('/add/ai/astrologer', addAstrologer);
router.post('/edit/ai/astrologer/:astrologerId', editAstrologer);
router.delete('/delete/ai/astrologer/:astrologerId', deleteAstrologer);

export default router;
