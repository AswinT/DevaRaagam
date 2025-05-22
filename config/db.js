const mongoose = require('mongoose');
const env = require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Databse Connection Successful ');
  } catch (error) {
    console.log('Database Connection Failed!!!!');
  }
}

module.exports =  connectDB
