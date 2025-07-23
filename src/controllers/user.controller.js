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

// generate both token at once;
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // this add bzc when we use save function, it validate password

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong will access and ref token!!");
  }
};

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

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address format!!");
  }

  const existUser = await User.findOne({
    // yaha pe ham single value bhi passkar shak thi hai like email
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "User with email or username already exist!!");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //console.log(req.files);
  //console.log(req.files?.avatar);
  //console.log(avatarLocalPath);

  //const coverImageLocalPath = req.files?.coverImage[0]?.path; // this okay but what is use send hi nahi kar tha data, then issue hai
  // also coverImage mandate nahi hai

  // here coverImage is handle properly with not mandate it
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // get data from frontend. req body -> data
  // which username or email
  // check data is empty
  // check user exist
  // validate user by email and user name
  // compare password
  // access and token assign
  // send cookie, send secure cookie
  const { password, email, username } = req.body;

  console.log("Login attempt for email:", email);
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist!!");
  }

  // here we are using user not User bzc User is assoicated mongoose schema
  // user current user , so jo method ham nai define kiye hai apne schema mee, they are access by this
  const ispasswordValid = await user.isPasswordCorrect(password);
  if (!ispasswordValid) {
    throw new ApiError(401, "password is incorrect!!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );
  const options = {
    // now we can modify this cookie by frontend only server can
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    // now we can modify this cookie by frontend only server can
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out!!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
