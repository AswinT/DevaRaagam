const getSignup = async(req,res) =>{
  try {
    res.render('signup');
  } catch (error) {
    res.status(400).render('error').send({
      success:false,
      message:'Error in rendering signup page'
    })
  }
}

module.exports = {                                                                    
  getSignup
}