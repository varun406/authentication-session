const express = require("express");
const bodyParser = require("body-parser")
const ejs = require("ejs")
const session = require("express-session");
const bcrypt = require("bcryptjs") ;
const mongoose = require("mongoose");
const MongoDBSession = require('connect-mongodb-session')(session);
const app = express();


app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

const User = require("./models/user")

const mongoURL = "mongodb://localhost:27017/sessions";

mongoose.connect(mongoURL,{useNewUrlParser:true})

.then((response) => {
    console.log("MongoDB Connected!!");
});

//storing session onto the database

const store = new MongoDBSession({ //storing session into mongodb 
    uri:mongoURL,
    collection:"mysessions"
})

app.use(session({
    secret:"secret password",
    resave:false, //for every save creates new session when true
    saveUninitialized:false,//if we not modiefied session then it will not saved
    store:store // remember this field for storing the sessions into mongoDB
}))


const isAuth = (req,res,next)=> {
    if (req.session.isAuth) {
        next() //calling the next middleware function like app.get("/",(req,res,next)
    } else {
        res.redirect("/login")
    }
}


app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/dashboard",isAuth,(req,res)=> {
    res.render("dashboard")
});


//login & register
app.post("/login",async(req,res)=> {

    const {email,password} = req.body;

    const user = await User.findOne({email});

    if(!user) {
        return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if (! isMatch) {
        return res.redirect("/login");
    }

    req.session.isAuth = true;

    res.redirect("/dashboard")

});

app.post("/register", async (req,res)=> {
    const {username,email,password} = req.body;

    let user = await User.findOne({email}); //it will not gonna store(wait) until the user found in database. 

    if (user){
        return res.redirect("/register"); //if the user becomes true then it will redirect to register page again to fill details
    }

    const hashedPassword = await bcrypt.hash(password, 12); //password,saltRounds

    user = new User({
        username,
        email,
        password:hashedPassword,
    })

    await user.save();

    res.redirect("/login");

})



app.post("/logout",(req,res)=> {
    req.session.destroy((err)=> {
        if (err) throw err;         //throw keyword in one line
        res.redirect("/");
    })
})

app.listen(process.env.PORT | 3000,()=> {
    console.log("Server is running on port 3000");
})