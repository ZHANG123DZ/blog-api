require("module-alias/register");
require("dotenv").config();
const express = require("express");

const router = require("@/routes/api");
const cors = require("cors");

const notFoundHandler = require("@/middlewares/notFoundHandler");
const errorsHandler = require("@/middlewares/errorHandler");
const handlePagination = require("@/middlewares/handlePagination");
const allowedOrigins = process.env.CLIENT_URL.split(",");
const cookieParser = require("cookie-parser");
const openai = require("@/utils/gemini");
const app = express();

//Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded());
app.use(handlePagination);
app.use("/api/v1", router);

//Error Handler
app.use(notFoundHandler);
app.use(errorsHandler);

app.listen(3000, () => {
  console.log("hello");
});
