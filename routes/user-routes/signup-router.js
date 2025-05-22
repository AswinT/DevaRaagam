const express = require('express');
const router = express.Router()
const signupController = require('../../controllers/user/signup-controller');

router.get('/signup',signupController.getSignup)

module.exports = router