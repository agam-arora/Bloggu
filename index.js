if(process.env.NODE_ENV !== 'production')
    require('dotenv').config();
const path=require('path')
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressLayouts=require('express-ejs-layouts');
const passport=require('passport');
const localstrategy=require('passport-local').Strategy;
const flash=require('express-flash')
const session=require("express-session")
const blogrouter=require('./router/blogs');
const userrouter=require('./router/users')
const methodOverride =require('method-override');
const Users =require('./models/users');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

mongoose.connect(process.env.DATABASE_URL,
    { 
        useNewUrlParser: true ,
        useUnifiedTopology: true ,
        useFindAndModify: false,
        useCreateIndex: true
    }
);
const db = mongoose.connection;

app.use(flash())
app.use(session({
    secret:"secret",
    resave: false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use('/plugin',express.static('public'));
app.use('/img',express.static('public'));
app.use('/css',express.static('public'))
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.use(mongoSanitize({
    replaceWith: '_'
}))

passport.use(new localstrategy(Users.authenticate()));

passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

app.set('layout','./layouts/layout')
db.on('error', error => console.error(error));
db.once('open', () => console.log('Connected to Mongoose'));
app.get('/',(req,res)=>{
    var check=false;
    if(req.isAuthenticated())
    {
        check=true;
    }
    res.render('home.ejs',{loginout: check});
})
app.use('/users',userrouter);
app.use('/blogs',blogrouter);
app.listen(process.env.PORT || 3000)