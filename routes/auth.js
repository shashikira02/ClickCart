const express = require("express");
const { check, body } = require("express-validator");
const csrf = require("csurf"); // 🔥 Ensure CSRF protection
const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();
const csrfProtection = csrf(); // Initialize CSRF

router.use(csrfProtection); // 🔥 Apply CSRF middleware

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email address.").normalizeEmail(),
    body("password", "Password has to be valid.").isLength({ min: 5 }).isAlphanumeric().trim(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value) => {
        try {
          const userDoc = await User.findOne({ email: value });
          if (userDoc) {
            throw new Error("E-Mail exists already, please pick a different one.");
          }
        } catch (err) {
          throw new Error("Error checking email existence. Please try again.");
        }
      })
      .normalizeEmail(),
    body("password", "Please enter a password with only numbers and text and at least 5 characters.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
