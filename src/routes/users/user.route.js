import { Router } from "express";
import {
    registerUser, changePassword, userLogin
} from "../../controller/user/userController.js";
import {
    addReview
} from "../../controller/user/addReviewController.js";
import { getAllAstrologers } from "../../controller/user/getAllAstrologersController.js";
import { forgetPassword, updatePassword_user, validateOtp } from "../../controller/user/userController.js"
import { ask_ai_astro, fetch_ai_astro_chat, toggleFreeChat } from "../../controller/user/ask_AI_Astro.js";
import { getAllLanguages } from "../../controller/admin/LanguageController.js";
import { add_wallet_balance, find_transaction_history_by_category } from "../../controller/user/addWalletBalance.js";
import { deleteNotifications, getAllNotificationsByUserId, getUnreadNotificationsCount, markNotificationsAsRead } from "../../controller/user/NotificationHandler.js";
import { upload } from "../../middlewares/multer.middlewre.js";
import { getAshtakootScore, getAshtakootScore_PDF } from "../../controller/user/third_party/match_making.js";
import { getDailyHoroscope, getPrevHoroscope, getTommHoroscope } from "../../controller/user/third_party/daily_horroscopes.js";
import { getDailyPanchang, getMonthlyPanchang } from "../../controller/user/third_party/daily_Panchang.js";
import { get_numerology } from "../../controller/user/third_party/numerology.js";

import { endCallAndLogTransaction, start_call } from "../../controller/user/callController.js";
import { getAutoSuggestAstrologer, getTrendingAstrologer } from "../../controller/user/getTopAstrologers.js";

const router = Router();

router.route("/signup", upload.single('photo')).post(registerUser);
router.route("/changepassword/:userId").post(changePassword);
router.route("/login").post(userLogin);
router.route("/addreview").post(addReview);
router.route("/getAstrologer").get(getAllAstrologers);
router.post('/send/otp', forgetPassword)
router.post('/validate/otp', validateOtp)
router.post('/update/password', updatePassword_user)
router.post('/ask/ai/astro', ask_ai_astro)
router.post('/ask/ai/astro', toggleFreeChat)
router.get('/get/languages', getAllLanguages)
router.post('/get/ai/chats', fetch_ai_astro_chat)
router.post('/add/balance', add_wallet_balance)
router.post('/get/balance/history', find_transaction_history_by_category)
router.put('/notifications/:userId/:notificationsId/read', markNotificationsAsRead);
router.get('/notifications/:userId', getAllNotificationsByUserId);
router.post('/start/call', start_call);

// router.post('/start/call', start_call);

//3rd party api call
router.post('/matchmaking', getAshtakootScore);
router.post('/matchmaking/pdf', getAshtakootScore_PDF);
router.post('/daily/horroscope', getDailyHoroscope);
router.post('/tommorow/horroscope', getTommHoroscope);
router.post('/yessterday/horroscope', getPrevHoroscope);
router.post('/daily/panchang', getDailyPanchang);
router.post('/monthly/panchang', getMonthlyPanchang);
router.post('/numerology', get_numerology);
router.post('/getnotifications/count', getUnreadNotificationsCount);
router.post('/getnotifications/delete', deleteNotifications);
router.post('/get/top/astrologers', getTrendingAstrologer);
router.post('/get/trending/astrologers', getTrendingAstrologer);
router.post('/get/suggest/astrologers', getAutoSuggestAstrologer);

router.post('/end/call', endCallAndLogTransaction);

export default router;