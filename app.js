require("dotenv").config();
const express = require("express");
const app = express();
const index = require("./routes/index");
const cors = require("cors");
const PORT = 8000;

app.use(cors());

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

app.use("/", index);
