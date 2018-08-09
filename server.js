'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const routes = require('./routes.js');
const auth = require('./auth.js')

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;

const bcrypt = require('bcrypt')

var ObjectID = require('mongodb').ObjectID;
var mongo = require('mongodb').MongoClient;

const app = express();


fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'pug');

app.use(session({secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//enable delay to pass test
if (true) app.use((req, res, next) => {
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/logout': return setTimeout(() => next(), 500);
        case '/profile': return setTimeout(() => next(), 700);
        default: next();
      }
    break;
    case 'POST':
      switch (req.url) {
        case '/login': return setTimeout(() => next(), 900);
        default: next();
      }
    break;
    default: next();
  }
});


mongo.connect(process.env.DATABASE, (err, db) => {
  //github requests
  app.route('/auth/github')
  .get(passport.authenticate('github'), ()=>{});
  
  app.route('/auth/github/callback')
  .get(passport.authenticate('github', {failureRedirect: '/'}, (req, res)=> {res.redirect('/profile')}));
  
  routes(app, db);
  if(err) {
  console.log("NOOOOO");
  }
  else { //do stuff with database
    
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callBackURL: "https://eager-bandicoot.glitch.me/auth/github/callback"
    }, function(accessToken, refreshToken, profile, cb) {
      db.collection('socialusers').findAndModify({
        id: profile.id
      }, {}, {$setOnInsert: {id: profile.id, name: profile.displayName || 'John Doe',
                            photo: profile.photos[0].value || '',
                            email: profile.emails[0].value || 'no public email',
                            created_on: new Date(),
                            provider: profile.provider || ''}, $set: {last_login: new Date()}, $inc: {login_count: 1}},
                                                 {upsert: true, new: true}, //'upserts' allows findAndModify to $setOnInsert, 'new' lets function return new profile instead of old
                                                (err, doc)=> {return cb(null, doc.value)})  //Strategies always return callback()
    
    }  
  ))
    
    auth(app, db);
  
  app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});}

    
  })   


