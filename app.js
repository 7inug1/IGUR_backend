/* eslint-disable no-unused-vars */
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./db");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

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
// app.use(cors({credentials: true, origin: true}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
  console.log("mode: " + process.env.MODE);
});

app.use("/", index);
