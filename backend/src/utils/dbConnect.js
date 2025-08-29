//Imports
const mongoose = require("mongoose");

// Connect to MongoDB
async function connectDB() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("❌ MONGO_URL is missing in env");
    process.exit(1);
  }
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri); // The database name is taken from the URI
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Exit process with failure
    process.exit(1);
  }
}

//Exports
module.exports = connectDB;
