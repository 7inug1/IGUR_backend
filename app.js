/* eslint-disable no-unused-vars */
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./db");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const index = require("./routes/index");
const cors = require("cors");
const PORT = 8080;

connectDB();

app.use(cors({
  origin: "https://igur.vercel.app",
  methods: ['GET', 'POST'],
}));
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "https://igur.vercel.app");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
// app.use(function (req, res, next) {
//   // const allowedOrigins = "https://igur.vercel.app";
//   // const origin = req.headers.origin;
//   // console.log("origin", origin);
//   // Website you wish to allow to connect
//   // res.setHeader('Access-Control-Allow-Origin', 'https://igur-frontend-7inug1.vercel.app/');
//   // if (allowedOrigins.includes(origin)) {
//   res.setHeader('Access-Control-Allow-Origin', "https://igur.vercel.app");

//   // res.setHeader("Access-Control-Allow-Origin", req.headers.origin);

//   // }
//   // Request methods you wish to allow
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//   // Request headers you wish to allow
//   res.setHeader("Access-Control-Allow-Headers", "*");

//   // Pass to next layer of middleware
//   next();
// });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add headers before the routes are defined

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

app.use("/", index);
