import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("Request reached registerUser controller!");
  return res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
