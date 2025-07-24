import { Router } from "express";
import {
  registerUser,
  changePassword,
  userLogin,
  validateloginOtp,
  getuserById,
  updateUserById,
  starCall,
  userLogout,
  deleteUserById,
  handleSendOTP,
  handleValidateOTPAndRegister,
} from "../../controller/user/userController.js";
import { addReview } from "../../controller/user/addReviewController.js";
import {
  getAllAstrologers,
  getAllAstrologersByCategory,
} from "../../controller/user/getAllAstrologersController.js";
import {
  forgetPassword,
  updatePassword_user,
  validateOtp,
} from "../../controller/user/userController.js";
import {
  ask_ai_astro,
  fetch_ai_astro_chat,
  toggleFreeChat,
} from "../../controller/user/ask_AI_Astro.js";
import { getAllLanguages } from "../../controller/admin/LanguageController.js";
import {
  add_wallet_balance,
  find_transaction_history_by_category,
  get_orders_by_user,
} from "../../controller/user/addWalletBalance.js";
import {
  deleteNotifications,
  getAllNotificationsByUserId,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
} from "../../controller/user/NotificationHandler.js";
import { upload } from "../../middlewares/multer.middlewre.js";
import {
  getAshtakootScore,
  getAshtakootScore_PDF,
} from "../../controller/user/third_party/match_making.js";
import {
  getDailyHoroscope,
  getPrevHoroscope,
  getTommHoroscope,
} from "../../controller/user/third_party/daily_horroscopes.js";
import {
  getDailyPanchang,
  getMonthlyPanchang,
} from "../../controller/user/third_party/daily_Panchang.js";
import { get_numerology } from "../../controller/user/third_party/numerology.js";

// import { endCallAndLogTransaction, start_call } from "../../controller/user/callController.js";
import {
  getAutoSuggestAstrologer,
  getTrendingAstrologer,
} from "../../controller/user/getTopAstrologers.js";
import {
  fetch_ai_astro_by_id,
  fetch_all_ai_astrologers,
} from "../../controller/user/getAllAiAstrologers.js";
import {
  fetchChatHistory,
  fetchChatHistoryById,
  fetchChatRoom_forUser,
} from "../../controller/user/chatController.js";
import {
  findCall_Transaction_ByUserId,
  findChat_Transaction_ByUserId,
  findVideo_Call_Transaction_ByUserId,
  findWalletByUserId,
} from "../../controller/user/transaction_history.js";
import { sendGift_To_Astrologer } from "../../controller/user/gift/send_gift.controller.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.route("/signup").post(registerUser);
router.route("/changepassword/:userId").post(changePassword);
router.route("/login").post(userLogin);
router.route("/logout").post(authenticateUser, userLogout);
router.route("/addreview").post(addReview);
router.route("/getAstrologer").get(getAllAstrologers);
router.route("/getAstrologer/by/category").post(getAllAstrologersByCategory);
router.route("/get/userDetails").get(getuserById);
router.route("/update/profile").post(updateUserById);
router.post("/send/otp", forgetPassword);
router.post("/validate/otp", validateOtp);
router.post("/validate/loginotp", validateloginOtp);
router.post("/update/password", updatePassword_user);
router.post("/ask/ai/astro", ask_ai_astro);
router.post("/toggle/ai/astro", toggleFreeChat);
router.get("/get/languages", getAllLanguages);
router.post("/get/ai/chats", fetch_ai_astro_chat);
router.post("/add/balance", add_wallet_balance);
router.post("/get/balance/history", find_transaction_history_by_category);
router.post(
  "/notifications/:userId/:notificationId/read",
  markNotificationsAsRead
);
router.get("/notifications/:userId", getAllNotificationsByUserId);
// router.post('/start/call', start_call);

// router.post('/start/call', start_call);

//3rd party api call
router.post("/matchmaking", getAshtakootScore);
router.post("/matchmaking/pdf", getAshtakootScore_PDF);
router.post("/daily/horroscope", getDailyHoroscope);
router.post("/tommorow/horroscope", getTommHoroscope);
router.post("/yesterday/horroscope", getPrevHoroscope);
router.post("/daily/panchang", getDailyPanchang);
router.post("/monthly/panchang", getMonthlyPanchang);
router.post("/numerology", get_numerology);
router.post("/getnotifications/count", getUnreadNotificationsCount);
router.post("/getnotifications/delete", deleteNotifications);
router.post("/get/top/astrologers", getTrendingAstrologer);
router.post("/get/trending/astrologers", getTrendingAstrologer);
router.post("/get/suggest/astrologers", getAutoSuggestAstrologer);

// router.post('/end/call', endCallAndLogTransaction);
router.post("/get/all/ai/astrologers", fetch_all_ai_astrologers);
router.get("/get/all/ai/astrologer/:astroId", fetch_ai_astro_by_id);
router.post("/get/chatsById", fetchChatHistory);
router.post("/get/chatHistory", fetchChatHistoryById);
router.post("/get/wallet/history", findWalletByUserId);
router.post("/get/video/history", findVideo_Call_Transaction_ByUserId);
router.post("/get/call/history", findCall_Transaction_ByUserId);
router.post("/get/chat/history", findChat_Transaction_ByUserId);
router.post("/get/chatroom", fetchChatRoom_forUser);
router.post("/agora-token", starCall);

// new routes
router.post("/send/gift", sendGift_To_Astrologer);
router.post("/orders", get_orders_by_user);

router.route("/update/:userId").patch(updateUserById);
router.delete("/delete/:userId", deleteUserById);

// New Flow
router.post("/send-otp", handleSendOTP);
router.post("/validate-otp", handleValidateOTPAndRegister);

export default router;
