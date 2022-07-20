/* eslint-disable no-unused-vars */
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./db");
const express = require("express");
// const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const index = require("./routes/index");
const PORT = 8080;

connectDB();
// process.env.MODE === "development"
//   ? app.use(cors())
//   : app.use(cors({
//   origin: "https://igur.vercel.app",
//   methods: ['GET', 'POST', 'PATCH'],
// }));
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://igur.vercel.app');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // res.setHeader('Content-Type', 'application/json');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
  console.log("mode: " + process.env.MODE);
});

app.use("/", index);
