const router=require('express').Router();
const Users =require('./../models/users')
const { Validator } = require('node-input-validator');
const passport = require('passport');
const connectEnsureLogin=require('connect-ensure-login')

//Register get
router.get('/register',connectEnsureLogin.ensureLoggedOut('/blogs'),(req,res)=>{
    res.render('user/register',{loginout:0});
})


//Register Post
router.post('/register',async (req,res) => {
    const v = new Validator(req.body, {
        username: 'required|minLength:4|maxLength:10',
        email: 'required|email',
        password: 'required|minLength:5|maxLength:10|alphaDash'
    },
    {
        username:'enter username of length between 5-10 charachter',
        email:'enter correct email',
        password:'enter password of length between 5-10 charachter with (0-9) and (a-z)(A-Z) and - and _'
    });
        
    const matched = await v.check();
        
    if (!matched) {
        res.status = 422;
        
        req.flash('failureMessages',v.errors)
        res.render('user/register',{loginout:0});
        return;
    }
    const username=(req.body.username)
    const email=(req.body.email)
    const password=(req.body.password)
    const user =new Users({username,email})
    await Users.register(user,password)
    res.render('user/login',{loginout:0})
    }
)

//Login get
router.get('/login',connectEnsureLogin.ensureLoggedOut('/blogs'),(req,res)=>{
    // req.flash('error','no')
    res.render('user/login',{loginout:0});
})

//Login Post
router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login',failureFlash:true,failureMessage:'Wrong username or password'}),  function(req, res) {
    req.flash('successMessage',"welcome")
    res.redirect('/blogs')
});

//Logout
router.get("/logout", (req, res) => {
    req.logout();
    res.render('user/login',{loginout:0});
  });

module.exports=router;
