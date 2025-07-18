import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userScheme = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // if this more into searching stuff
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary se url mile gaa.
      required: true,
    },
    coverImage: {
      type: String, // cloudinary se url mile gaa.
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: ["true", "Password is requires"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// userScheme.pre("save",()=>{}); // this bad X
// here pre mean before event, save mean before saving data,
// second is call back, never use ()=>{} arrow function call back,

userScheme.pre("save", async function (next) {
  // approch 1
  //   if (this.isModified("password")) {
  //     this.password = bcrypt.hash(this.password, 10);
  //     next();
  //   }
  // second approch 2 by negate
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
  next();
});

// custom method
userScheme.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
  // this return true or false.
};

userScheme.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this.email,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userScheme.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.email,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userScheme);
