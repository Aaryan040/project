//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
//if we use 'view engine' then we don't have to provide extension to the file in res.render

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser : true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


//this is used to encrypt the password
const user = new mongoose.model('user', userSchema);

app.get('/', (req, res)=>{
    res.render('home');
})

app.get('/register', (req, res)=>{
    res.render('register');
})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.post('/register', (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new user({
            email : req.body.username,
            password : hash
        });
    
        newUser.save().then((result) => {
            res.render('secrets');
        }).catch((err) => {
            console.log(err);
            // res.redirect('/register'); // Redirect to registration page on error
        });
    });

});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    user.findOne({ email: username })
    .then((foundUser) => {
        if (foundUser){
            bcrypt.compare(password, foundUser.password, function(err, result) {
                if(result === true){
                    res.render('secrets');
                }
            });
        } else {
            // Handle incorrect username or password
            res.redirect('/login');
        }
    })
    .catch((err) => {
        console.log(err);
    });

})

app.listen(port, ()=>{
    console.log(`app is listening on the http://localhost:${port}`);
})
