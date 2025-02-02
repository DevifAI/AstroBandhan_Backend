import express from 'express';
import { createLanguage, deleteLanguage, getAllLanguages, } from '../../controller/admin/LanguageController.js';
import { registerAstrologer } from '../../controller/admin/addAstrologerController.js';
import { editProfilePhoto } from '../../controller/admin/editAstrologerProfilePhoto.js';
import { uploadAstrologerData } from '../../controller/admin/addAstrologerViaExcelController.js';;
import { upload } from '../../middlewares/multer.middlewre.js';
import { findAstrologerByVerified } from '../../controller/admin/findAstrologerByVerified.js';
import { updateAstrologerFields } from '../../controller/admin/updateAstrologerFields.js';
import { deleteAstrologer_original, editAstrologer_original, getAstrologers } from '../../controller/admin/findAstrologerBy_id_name_specialities.js';
import { addAstrologerToCategory, addCategory, deleteAstrologerFromCategory, deleteCategory, editCategory, getAI_AstrologersByCategoryName, getAstrologersByCategoryName, getCategoryList, reassignAstrologerToCategory } from '../../controller/admin/AstrologerCategory.js';
import { deleteAstrologerRequest, getPendingAstrologerRequests } from '../../controller/admin/getPendingAstrologerRequest.js'
import { addAstrologer, editAstrologer, deleteAstrologer } from '../../controller/admin/ai_astrologerController.js';
import { addProductCategory, deleteProductCategory, editProductCategory } from '../../controller/admin/addProductCategoryController.js';
import { get_calls_chats_counts, get_total_astrologers, get_total_Calls, get_total_Chats, get_total_completed_chat, get_total_Due, get_total_Due_Details, get_total_Earning, get_total_Horroscope, get_total_Order, get_total_users, get_total_Video_Calls, get_unverified_astrologers, get_wallet_recharges_and_payouts, getAdminProfile, getTotalCredit_Admin, getTotalCredit_Wallet_Recharge_Admin } from '../../controller/admin/dashboard/manageDashboard.js';
import { changePasswordAdmin, forgotPasswordAdmin, getAdminById, loginAdmin, registerAdmin, validateOtpAdmin } from '../../controller/admin/admin.controller.js';
import { getAstrology_History } from '../../controller/admin/App_History/astrologer_history.js';
import { getCall_History, getVideo_Call_History } from '../../controller/admin/App_History/audio_call_history.js';
import { Send_Log_In_OTP, Verify_Log_In_OTP } from '../../controller/astrologer/astrologerAuthController.js';
import { ApproveWithdrawalRequest } from '../../controller/admin/withdrawl_request_approve.js';
import { getTopAstrologersThisWeek } from '../../controller/admin/getTopAstrologers.js';
import { getAllUsers } from '../../controller/admin/customers/getAllCustomers.js';
import { fetch_all_ai_astrologers_admin } from '../../controller/admin/astrologers/getAllAiAstrologers.js';
import { getChat_History, getChatRoom_History, getChatRoomHistoryByDateRange } from '../../controller/admin/App_History/chat_history.js';
import { fetch_ai_astro_chats } from '../../controller/user/getAllAiAstrologers.js';


const router = express.Router();

// ===============================Authentication routes start===============================
router.post('/signup', registerAdmin);
router.post('/login', loginAdmin);
router.post('/change-password', changePasswordAdmin);
router.post('/forgot-password', forgotPasswordAdmin);
router.post('/validate-otp', validateOtpAdmin);
router.get('/profile/:id', getAdminById);
router.post('/login/otp', Send_Log_In_OTP);
router.post('/verify/login/otp', Verify_Log_In_OTP);
router.post('/get/all/ai/astrologers', fetch_all_ai_astrologers_admin);






// Route to create a language
router.post('/add/language', createLanguage);
router.post('/get/languages', getAllLanguages);
// Route to delete a language by ID
router.delete('/language/:id', deleteLanguage);
router.post('/signup/astrologer', registerAstrologer);
router.put('/editprofilephoto/astrologer/:astrologerId', upload.single('avatar'), editProfilePhoto)

// Use the multer middleware in the route
router.post('/signup/astrologer/excel', upload.single('excel_astrologer'), uploadAstrologerData);

router.post('/astrologers/find-by-verified', findAstrologerByVerified);
router.post('/astrologer/update', updateAstrologerFields);
router.post('/getastrologers', getAstrologers);
router.post('/upadteastrologers', editAstrologer_original);
router.post('/delete/astrologer/original', deleteAstrologer_original);
router.post('/add/category', addCategory);
router.post('/get/astrologer/category', getCategoryList);
router.post('/edit/category', editCategory);
router.post('/reassign/astrologer', reassignAstrologerToCategory);
router.delete('/delete/category/:categoryId', deleteCategory);
router.post('/add/astrologer/category', addAstrologerToCategory);
router.delete('/delete/astrologer/category', deleteAstrologerFromCategory);
router.get('/astrologers/by-category/:categoryName', getAstrologersByCategoryName);
router.get('/ai/astrologers/by-category/:categoryName', getAI_AstrologersByCategoryName);
router.get('/pending-astrologer-requests', getPendingAstrologerRequests);
router.post('/delete-astrologer-requests', deleteAstrologerRequest);

//need to check all this api, in progress
router.post('/add/ai/astrologer', addAstrologer);
router.post('/edit/ai/astrologer/:astrologerId', editAstrologer);
router.post('/delete/ai/astrologer/', deleteAstrologer);
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
router.post('/get/video/history', getVideo_Call_History);
router.post('/get/adminprofile', getAdminProfile);
router.post('/get/total/credit', getTotalCredit_Admin);
router.post('/get/total/wallet_recharge', getTotalCredit_Wallet_Recharge_Admin);
router.post('/payment/request', ApproveWithdrawalRequest);
router.post('/top/astrologers', getTopAstrologersThisWeek);
router.post('/get/users', getAllUsers);
router.post('/get/chat/history', getChatRoom_History);
router.post('/get/chat/history/bydate', getChatRoomHistoryByDateRange);
router.post('/get/chat/details/history', getChat_History);
router.post('/get/total/withdrawl/details', get_total_Due_Details);
router.post('/get/ai/chats/history', fetch_ai_astro_chats);
// router.post('/add/astrologer/category', add_Category_for_astrologer);
// router.post('/edit/astrologer/category', edit_Category_for_astrologer);
// router.post('/delete/astrologer/category', delete_Category_for_astrologer);

export default router;
