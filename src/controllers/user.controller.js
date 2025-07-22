import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import { User } from ".././models/user.models.js";
import { uplaodOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// this testing phase
// const registerUser = asyncHandler(async (req, res) => {
//   console.log("Request reached registerUser controller!");
//   return res.status(200).json({
//     message: "ok",
//   });
// });

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation for data, frontend
  // check if user already exist, username, email se check kar loo
  // check for Image, check for avatar
  // upload them cloudinary, check avatar huaa kya nahi
  // create user object - create entry in db, db call
  //  remove password and refresh token field from response
  // check for user creation,
  // return response, or return null

  //req.body; // for form, json data

  const { fullName, email, username, password } = req.body;
  console.log("email:", email);
  // below one is okay
  //   if (fullName === "") {
  //     throw new ApiError(400, "fullname is required!!");
  //   }

  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!!");
  }

  if (!email.include("@")) {
    throw new ApiError(400, "Invalid email address format!!");
  }

  const existUser = User.findOne({
    // yaha pe ham single value bhi passkar shak thi hai like email
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "User with email or username already exist!!");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const avatar = await uplaodOnCloudinary(avatarLocalPath);
  const coverImage = await uplaodOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // this hame kya nai chahiye
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong will register user!!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!!"));
});

export { registerUser };
