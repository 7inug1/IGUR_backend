// const mongoose = require("mongoose");

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
// });

// const db = mongoose.connection;
// console.log("db", db);

// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", console.log.bind(console, "Connected to database.."));

// module.exports = db;

const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      //must add in order to not get any error masseges:
      useNewUrlParser: true,
    })
    console.log(`mongo database is connected!!! ${conn.connection.host} `)
  } catch (error) {
    console.error(`Error: ${error} `)
    process.exit(1) //passing 1 - will exit the proccess with error
  }
};

module.exports = connectDB;
