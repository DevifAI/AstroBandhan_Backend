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
import { deleteAstrologerRequest, getPendingAstrologerRequests } from '../../controller/admin/getPendingAstrologerRequest.js'
import { addAstrologer, editAstrologer, deleteAstrologer } from '../../controller/admin/ai_astrologerController.js';
import { addProductCategory, deleteProductCategory, editProductCategory } from '../../controller/admin/addProductCategoryController.js';
import { get_calls_chats_counts, get_total_astrologers, get_total_Calls, get_total_Chats, get_total_completed_chat, get_total_Due, get_total_Earning, get_total_Horroscope, get_total_Order, get_total_users, get_total_Video_Calls, get_unverified_astrologers, get_wallet_recharges_and_payouts, getAdminProfile } from '../../controller/admin/dashboard/manageDashboard.js';
import { changePasswordAdmin, forgotPasswordAdmin, getAdminById, loginAdmin, registerAdmin, validateOtpAdmin } from '../../controller/admin/admin.controller.js';
import { getAstrology_History } from '../../controller/admin/App_History/astrologer_history.js';
import { getCall_History } from '../../controller/admin/App_History/audio_call_history.js';
const router = express.Router();

// ===============================Authentication routes start===============================
router.post('/signup', registerAdmin);
router.post('/login', loginAdmin);
router.patch('/change-password/:adminId', changePasswordAdmin);
router.post('/forgot-password', forgotPasswordAdmin);
router.post('/validate-otp', validateOtpAdmin);
router.get('/profile/:id', getAdminById);


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
router.post('/delete-astrologer-requests', deleteAstrologerRequest);

//need to check all this api, in progress
router.post('/add/ai/astrologer', addAstrologer);
router.post('/edit/ai/astrologer/:astrologerId', editAstrologer);
router.delete('/delete/ai/astrologer/:astrologerId', deleteAstrologer);
router.post('/add/product/category', addProductCategory);
router.post('/edit/product/category/:id', editProductCategory);
router.delete('/delete/product/category/:id', deleteProductCategory);
router.get('/totalastrologers', get_total_astrologers);
router.get('/totalusers', get_total_users);
router.get('/totalchats', get_total_completed_chat);
router.get('/totalorders', get_total_Order);
router.get('/totalearnings', get_total_Earning);
router.get('/totalcalls', get_total_Calls);
router.get('/totalchats', get_total_Chats);
router.get('/totalvideocalls', get_total_Video_Calls);
router.get('/totalhorroscope', get_total_Horroscope);
router.get('/totalDue', get_total_Due);
router.get('/reveneuvspayout', get_wallet_recharges_and_payouts);
router.get('/callchats/counts', get_calls_chats_counts);
router.get('/unverified/astrologers', get_unverified_astrologers);
router.get('/get/chat/history', getAstrology_History);
router.post('/get/call/history', getCall_History);
router.post('/get/adminprofile', getAdminProfile);

export default router;
