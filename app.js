//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
//if we use 'view engine' then we don't have to provide extension to the file in res.render

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));


//this app.use must be placed between other app.use and mongoose.connect
app.use(session({
    secret : "Our little secret.",
    resave : false,
    saveUninitialized : false
}));

//this is used to initialize the passport package
app.use(passport.initialize());
//this is used to deal with the session
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser : true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

userSchema.plugin(passportLocalMongoose);

//this is used to encrypt the password
const user = new mongoose.model('user', userSchema);

passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser())

app.get('/', (req, res)=>{
    res.render('home');
})

app.get('/register', (req, res)=>{
    res.render('register');
})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.get('/secrets', (req, res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else{
        res.redirect('/login');
    }
});

app.get('/logout', (req, res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

app.post('/register', (req, res)=>{
    user.register({username : req.body.username}, req.body.password, (err, User)=>{
        if(err){
            console.log(err);
            res.redirect('/');
        }
        else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            })
        }
    })
});

app.post('/login', (req, res)=>{
    const User = new user({
        username : req.body.username,
        password : req.body.password
    });

    req.login(User, (err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            });
        }
    })
})

app.listen(port, ()=>{
    console.log(`app is listening on the http://localhost:${port}`);
})
