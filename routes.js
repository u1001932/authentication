const passport = require('passport');
const bcrypt = require('bcrypt');


module.exports = function(app, db) { //set this function as the export of this model 
  //(ie. The command "Node routes.js -para -para" will return the result of this function)

  app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index', {message: 'Hello', title: 'login', showLogin: true, showRegistration: true}); //render using Pug, putting variables in .pug file
  });
    
  // middleware to ensure authentication before redirect to /profile
  function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {//method created by passport 
      next();
    }
    res.redirect('/');
  }
  
  
  // remember to place authentication methods in db connection
  app.route('/login')
  .post(passport.authenticate('local', {failureRedirect: '/'}) , (req, res)=> { //if authentication successful, user object will be stored in req.user
     res.render(process.cwd() + '/views/pug/profile', {username: req.body.username});
});
  // ensures authentication if user directly gets profile; place authentication methods in db connection!
  app.route('/profile')
    .get(ensureAuthenticated, (req, res)=> {res.render(process.cwd()+'/views/pug/profile', {username: req.user.username})});
  
  
  
  //registration: find if user alreaday exists => if so, redirect to home. if not, insert one into database, authenticate, and show profile
    app.route('/register')
    .post((req, res, next)=> { //use next(), as there's a chain of 3 middleware in post
      db.collection('users').findOne({username: req.body.username}, function(err, user) {//1st middleware, db.collection.findOne()
        if(err) {
          console.log("SNAPPPP 0")
          next(err);
        }
        else if (user) {
          console.log("SNAPPPPPP 1")
          res.redirect('/');
        }
        else {
          db.collection('users').insertOne({username: req.body.username, password: bcrypt.hashSync(req.body.password, 12)}, function(err, doc){
            if (err) {
              console.log("SNAPPPPPP 2")
              res.redirect('/');
            }
            else {
              next(null, doc);
            }
          })
        
        }
      })}, passport.authenticate('local', {failureRedirect: '/'}), /*2nd middleware, authenticate, executes next(err/doc) when done*/
        (req, res, next) => { //final middleware
        res.redirect('/profile')
      } 

    );
    
  //logout; also a password/authentication method, but can be called ANYWHERE (doesn't need to be in db connection)
app.route('/logout')
  .get((req, res)=> {
    req.logout(); //important!! REQ.lougout(), not res
    res.redirect('/'); 
  })

  
// handling request for pages that don't exist
app.use((req,res,next)=> {
  res.status(404);
  res.type('text');
  res.send('Not found');
})
}