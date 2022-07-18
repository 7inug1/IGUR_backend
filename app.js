/* eslint-disable no-unused-vars */
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./db");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const index = require("./routes/index");
const cors = require("cors");
const PORT = 8080;

app.use(cors(
  { origin: '*' }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

app.use("/", index);
