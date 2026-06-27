import mongoose from "mongoose";
import { DB } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB}`
    );
    console.log(
      `\n MONGO DB connect !! DB HOST: ${connectionInstance.connection.host} \n`
    );
    return connectionInstance.connection.host;
  } catch (error) {
    console.error("MONGO DB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
