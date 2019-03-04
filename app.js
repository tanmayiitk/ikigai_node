var express = require('express');
var mongoose=require("mongoose");
var passport = require("passport");
var bodyParser = require("body-parser");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
const cookieSession = require("cookie-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
var User = require("./models/user");
// var flash = require('express-flash-messages')


mongoose.connect("mongodb://localhost/auth_demo_app");
 
var app = express();
app.set("view engine", "ejs");
 app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(require("express-session")({
    secret:"Raven",
    resave: false,
    saveUninitialized : false
}));


app.use(passport.initialize());
app.use(passport.session());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());   
passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user.id);
     });

    passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
    });

passport.use(new LocalStrategy(User.authenticate()));


/////////////Routes///////////  

app.get("/", function(req,res){
    res.render("home");
});

app.get("/secret", isLoggedIn ,  function(req,res){
   res.render("secret"); 
});
app.get("/register",function(req,res){
    res.render("register");
});

// handing user signup
app.post("/register", function(req,res){
    req.body.username
    req.body.password
    
    User.register(new User({username:req.body.username}), req.body.password, function(err, user){
         if(err){
             console.log(err);
             res.send("exists");
             return res.render('register');
         }
             passport.authenticate("local")(req, res, function(){
                 res.redirect("/secret");
             });
         
    });
});
app.get("/faq", function(req,res){
    res.render("faq");
});
app.get("/aboutUs", function(req,res){
    res.render("aboutUs");
});

// Login Routes
app.get("/login", function(req,res){
    res.render("login");
})
//login logic
//middleware
// app.post("/login", passport.authenticate("local",{
//     successRedirect:"/secret",
//     failureRediect:"/local"
// }),function(req,res){
//      res.send("logged in");
// });
var mongoid="";
var result="";
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
                 // here you can access user info
                 var name  = req.body.username;
         User.find({"username" : name}).lean().then(function(records) {
            records.forEach(function(record) 
            {
            var result= record;
            mongoid = result.username;

            console.log(result);
            res.render("detailsform",{result: result});

            });
        });

         // res.redirect('../profiles/edit/' + result._id);
});
var googleProfile="";
passport.use(
    new GoogleStrategy(
        {
            clientID: '22042764040-4cqmbkm1k4lt4dbdsi41hopiplfp995c.apps.googleusercontent.com',
            clientSecret: 'nx9DB0-7idr9BL0StFWSG_7k',
            callbackURL: "/auth/google/callback",
            proxy: true 
        },
        (accessToken, refreshToken, profile, done) => {
            // console.log('access token', accessToken);
            // console.log('refresh token', refreshToken);
             // console.log('profile :', profile);
             // console.log("email:" + profile.emails[0].value);
             // console.log('tanmay :', profile.displayName);

            User.findOne({ googleId: profile.id})
                .then((existingUser) => {
                    if (existingUser){
                        //we already have a record with the given profile
                        done(null , existingUser);
                    }else {
                        // we don't have user record with this id make a new record
                        new User ({googleId: profile.id}, {email : profile.emails[0].value})
                        .save()
                        .then(user => done(null, user));

                    }
                }
            );          
        }
    )        
);

app.get("/auth/google",  

    passport.authenticate("google", {scope: ["profile", "email"] }),
    
    );
app.get("/auth/google/callback", passport.authenticate("google"),
    function(req,res){
        console.log(">>>>>>>" + req.body);
        // name= req.body.displayname;
        //  User.find({"username" : name}).lean().then(function(records) {
        //     records.forEach(function(record) 
        //     {
        //     var result= record;
        //     mongoid = result.username;

        //     console.log(result);
        //     res.render("detailsform",{result: result});

        //     });
        // });
    }
    );

app.get("/api/logout", (req, res) => {
        req.logout();
        res.send(req.user);
    });

app.get("/api/current_user", (req, res) => {
        res.send(req.user);
    });

app.get("/detailsform", function(req,res){

    User.find({"_id" :mongoid},function(err,logindetails){
       if(err){
           console.log(err);
       } else
       {
        
        // console.log(logindetails);
        res.render("detailsform");   

       }
    });
       
});

app.post("/detailsform/:id", function(req,res){
    // req.body.firstName
    // req.body.Age
    // console.log(str);
    // var newData = {$set :{}}
    User.findByIdAndUpdate(req.params.id,req.body,function(err,foundUser){
       if(err){
           console.log(err);
       } else
       {
        res.render("home");   
       }
    });
       
});
//Logout Routes
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}




app.listen("5858",function(){
    console.log("Server started" );

});