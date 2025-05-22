const express = require('express');
const app = express();
const path = require('path');
const env = require('dotenv').config();
const session = require('express-session');
const connectDB = require('./config/db');

const userRoute = require('./routes/user-routes/signup-router');
// const adminRoute = require('./routes/admin-routes');
const { connect } = require('./routes/user-routes/signup-router');


connectDB();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set('view engine', 'ejs');
app.set('views',[
  path.join(__dirname,'views/user'),
  path.join(__dirname,'views/admin'),
]);

app.use('/user',userRoute);
// app.use('/admin',adminRoute);

const PORT = process.env.PORT || 3001
app.listen(PORT,() =>{
  console.log(`Server is running on http://localhost:${PORT}`)
})