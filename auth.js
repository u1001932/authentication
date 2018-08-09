const passport = require('passport');
const bcrypt = require('bcrypt');
const mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var LocalStrategy = require('passport-local').Strategy;
var GitHubStrategy = require('passport-github').Strategy;

module.exports = function(app, db) { //set this function as the export of this model 
  //(ie. The command "Node auth.js -para -para" will return the result of this function)
  passport.serializeUser((user, done)=>done(null, user._id));
    passport.deserializeUser(function(id, done){
      db.collection('users').findOne({_id: new ObjectID(id)}, function(err, doc){
      
        done(null, doc);
        
      })
    });

    passport.use(new LocalStrategy(function(username, password, done){
      db.collection('users').findOne({username: username}, (err, user)=> {
        console.log(user + "login attempted!")
        if(err){
           return done(err);
        }
        if (!user) {
          return done(null, false)
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      })
    }));
  
}