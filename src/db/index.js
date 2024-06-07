import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const dbConnect = async () => {
  try {
    const connectionVar = await mongoose.connect(
      `${process.env.DATABASE_URI}/${DB_NAME}`
    );
    console.log(`\n Mongodb connected ! db host: ${connectionVar.connection.host}`);
  } catch (error) {
    console.error("Mongodb connection error :", error);
    process.exit(1);
  }
};

export default dbConnect;