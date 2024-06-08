import dotenv from "dotenv";
// require('dotenv').config({path:'./env'})
import dbConnect from "./db/index.js";

dotenv.config({
  path: "./.env",
});

dbConnect()
  .then(() => {
    app.listen(process.env.PORT || 6000, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection failed !! ", error);
  });
