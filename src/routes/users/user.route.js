import { Router } from "express";
import {
    registerUser, changePassword, userLogin
} from "../../controller/user/userController.js";
import {
    addReview
} from "../../controller/user/addReviewController.js";
import { getAllAstrologers } from "../../controller/user/getAllAstrologersController.js";
import { forgetPassword, updatePassword_user, validateOtp } from "../../controller/user/userController.js"
import { ask_ai_astro, fetch_ai_astro_chat } from "../../controller/user/ask_AI_Astro.js";
import { getAllLanguages } from "../../controller/admin/LanguageController.js";
import { add_wallet_balance, find_transaction_history_by_category } from "../../controller/user/addWalletBalance.js";
const router = Router();

router.route("/signup").post(registerUser);
router.route("/changepassword/:userId").post(changePassword);
router.route("/login").post(userLogin);
router.route("/addreview").post(addReview);
router.route("/getAstrologer").get(getAllAstrologers);
router.post('/send/otp', forgetPassword)
router.post('/validate/otp', validateOtp)
router.post('/update/password', updatePassword_user)
router.post('/ask/ai/astro', ask_ai_astro)
router.get('/get/languages', getAllLanguages)
router.post('/get/ai/chats', fetch_ai_astro_chat)
router.post('/add/balance', add_wallet_balance)
router.post('/get/balance/history', find_transaction_history_by_category)
export default router;