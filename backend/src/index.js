//Imports
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./utils/dbConnect");


//Inits
const app = express();
const origin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
const PORT = process.env.PORT || 3000;

//Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: origin,
    credentials: true,
  })
);
app.use(morgan("dev"));

//Routes


//Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
});
