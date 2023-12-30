//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
const port = 3000;

//this is used to view thw api_key
console.log(process.env.API_KEY);

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
userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ['password']});

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
    const newUser = new user({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save().then((result) => {
        res.render('secrets');
    }).catch((err) => {
        console.log(err);
        // res.redirect('/register'); // Redirect to registration page on error
    });
});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    user.findOne({ email: username })
    .then((foundUser) => {
        if (foundUser && foundUser.password === password) {
            res.render('secrets');
        } else {
            // Handle incorrect username or password
            res.redirect('/login');
        }
    })
    .catch((err) => {
        console.log(err);
        // Handle other errors
        res.redirect('/login');
    });

})

app.listen(port, ()=>{
    console.log(`app is listening on the http://localhost:${port}`);
})
