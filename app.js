//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password : String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//this is used to encrypt the password
const user = new mongoose.model('user', userSchema);

passport.use(user.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, User) {
      return cb(err, User);
    });
  }
));

app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

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
