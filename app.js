/* eslint-disable no-unused-vars */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const index = require("./routes/index");
const cors = require("cors");
const PORT = 8000;
const db = require("./db");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

app.use("/", index);
