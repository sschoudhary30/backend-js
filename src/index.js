//require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";

import { app } from "./app.js";

// don't create app again here, then it create new app there will no sync in app.js and index.js

// function connectDB(){
// }
// connectDB()
// above is good but not that efficient

// os use IIFE approuch
//()()
// ; in front is for cleaning proposes

// below iife approuch is good but getting more better.

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//     after DB connection agar app interact nahi kar pa raha then ye app.on likha hai
//     app.on("error", (error) => {
//       console.log("ERROR :", error);
//       throw error;
//     });
//      if app is listening then do this
//     app.lister(process.env.PORT, () => {
//       console.log(`App is listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR: ", error);
//     throw error;
//   }
// })();

// more better apporuch is that make new file in DB, database folder, and write function over there then export it to index.js file

// connectDB function, tho ham nai DB ka asnychronius method likh which return promises on completion.
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("error", (error) => {
        console.log("errr", error);
        throw error;
      });
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is runing at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!!!", err);
  });
