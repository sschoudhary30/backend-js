import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// router.post("/login", (req, res) => {
//   console.log("✅ /login test route was hit successfully!");
//   res.status(200).json({ message: "Login test route is working!" });
// });

// 3. A minimal test for the logout route
// router.post("/logout", (req, res) => {
//   console.log("✅ /logout test route was hit successfully!");
//   res.status(200).json({ message: "Logout test route is working!" });
// });

router.route("/login").post(loginUser);

// secured route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
