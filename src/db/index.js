import mongoose from "mongoose";

import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connentionInstances = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );

    console.log(
      `\n MongoDB connected !! DB Host${connentionInstances.connection.host}`
    );
  } catch (error) {
    console.log("Mongo connection error", error);
    // node js hame process detha hai and usee ham exit kar shak thi hai code like 1, instead of using throw error
    process.exit(1);
  }
};

export default connectDB;
