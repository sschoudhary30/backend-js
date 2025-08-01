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

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid passoword");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetch successfull"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!!");
  }

  const user = User.findById(
    req.user?._id,
    {
      $set: {
        // fullName:fullName,// as both are same variable we can write as fullName only
        fullName,
        email,
      },
    },
    { new: true }
  ).select(" -password ");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Account detail updated succesfully!!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing!!");
  }

  const oldAvatarUrl = req.user.avatar;

  const avatar = await uplaodOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  if (oldAvatarUrl) {
    const oldAvatarPublicId = getPublicIdFromUrl(oldAvatarUrl);
    if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId, "image");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully!!"));
});

const updateUserCover = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is not uploaded properly!!");
  }

  const oldCoverImageUrl = req.user.coverImage;

  const coverImage = await uplaodOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "Cover is not properly uploaded on cloudnary!!");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  );

  if (oldCoverImageUrl) {
    const oldCoverImagePublicId = getPublicIdFromUrl(oldCoverImageUrl);
    if (oldCoverImagePublicId) {
      await deleteFromCloudinary(oldCoverImagePublicId, "image");
    }
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully!!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiResponse(400, "Username is missing");
  }

  // values after aggregate pipeline are arrays
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // this Subscription is name of model but in mongoDB it stored as subscriptions, all in same case with s added as suffix in back
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subsciber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subsciber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel dose not exist!!");
  }

  console.log(channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully!!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory),
      "Watch history fetch successfully"
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getWatchHistory,
};
