import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// below for from
app.use(
  express.json({
    limit: "16kb",
    // this limit define how much data can json bring
  })
);

// url data encoding
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// to store image, file
app.use(express.static("public")); // we alredy have public folder hai that
app.use(cookieParser());
// multer is use for file handing on upload

// express doc mostly work on request or response only
// req.prams by url
// req.body by form or json
// req.cookie-parser

// routes

import userRouter from "./routes/user.route.js";

// routes declaration;
// when we use router then use .use not .get
// app.use("/users", userRouter); this normal way

app.use("/api/v1/users", userRouter); // this production grade way
// http://localhost:8000/user/register
// http://localhost:8000/api/v1/user/register

export { app };
