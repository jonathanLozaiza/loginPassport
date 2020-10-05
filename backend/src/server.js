const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const cors = require("cors");
const User = require("./user");

//initialize
mongoose.connect("mongodb://localhost:27017/userdb",{
    useNewUrlParser:true,
    useUnifiedTopology:true
}, () => {
    console.log("database connected successfully")
})

const app = express();
app.set('port',process.env.PORT || 4000);

//midlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors({
    origin:'http://localhost:3000', //dirname react app
    credentials:true
}));
app.use(session({
    secret:"secretword",
    resave:true,
    saveUninitialized:true
}));
app.use(cookieParser('secretword'));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

////////////////////////////////////////END OF MIDLEWARE//////////////////////////////////////

//routes
app.post('/login',(req,res,next)=>{
    passport.authenticate('local',(err,user,info)=>{
        if(err) throw err;
        if(!user) res.send("user not found");
        else{
            req.logIn(user, (err) => {
                if(err) throw err;
                res.send("user authenticated");
                console.log(req.user);
            });
        }
    })(req,res,next);
});
app.post('/register',async (req,res)=>{
    try{
        const {username, password} = req.body;
        let user = await User.findOne({username});
        if(user){
            return res.status(401).json({msg:"User is alredy taken"})
        }
        user = new User();
        user.username = username;
        const salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(password,salt);
        await user.save();
        res.json({user});
    }catch(err){
        console.log(err);
        res.status(500).json({msg:err});
    }
});
app.get('/user',(req,res)=>{
    res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
})

app.get('/signOut',(req,res,next)=>{
    req.logOut();
    res.send("user not authenticated");
})

app.listen(app.get('port'),()=>{
    console.log('server on port ',app.get('port'));
});