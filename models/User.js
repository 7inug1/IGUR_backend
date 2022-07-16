const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  reports: { type: Array, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
