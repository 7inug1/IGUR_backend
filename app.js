/* eslint-disable no-unused-vars */
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./db");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const index = require("./routes/index");
const cors = require("cors");
const PORT = 8080;

const corsOptions = {
  origin: ['https://igur.vercel.app/', 'https://igur-frontend-7inug1.vercel.app/', 'https://igur-frontend-git-master-7inug1.vercel.app/'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add headers before the routes are defined
// app.use(function (req, res, next) {
//   const allowedOrigins = ['https://igur.vercel.app/', 'https://igur-frontend-7inug1.vercel.app/', 'https://igur-frontend-git-master-7inug1.vercel.app/'];
//   const origin = req.headers.origin;
//   // Website you wish to allow to connect
//   // res.setHeader('Access-Control-Allow-Origin', 'https://igur-frontend-7inug1.vercel.app/');
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   // Request methods you wish to allow
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//   // Request headers you wish to allow
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader('Access-Control-Allow-Credentials', true);

//   // Pass to next layer of middleware
//   next();
// });
connectDB();

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

app.use("/", index);
