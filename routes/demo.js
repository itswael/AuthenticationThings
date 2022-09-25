const express = require("express");

const db = require("../data/database");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;
  req.session.inputData = null;

  if(!sessionInputData){
    sessionInputData = {
      hasError: false,
      email: '',
      confirmEmail: '',
      password: '',
    };
  }
  res.render("signup",{inputData: sessionInputData});
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;
  req.session.inputData = null;

  if(!sessionInputData){
    sessionInputData = {
      hasError: false,
      email: '',
      password: '',
    };
  }
  res.render("login", {inputData: sessionInputData});
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredUserEmail = userData.email;
  const enteredConfirmEmail = userData["confirm-email"];
  const enteredPassword = userData.password;

  if (
    !enteredUserEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 ||
    enteredConfirmEmail !== enteredUserEmail ||
    !enteredUserEmail.includes("@")
  ) {
    console.log('entered valid email/password');

    req.session.inputData = {
      hasError:true,
      message:'Invalid Input - please check your data',
      email: enteredUserEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(function(){
      res.redirect('/signup');
    });

    return;
    
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredUserEmail 
  });

  if(existingUser){
    req.session.inputData = {
      hasError:true,
      message:'user already exists',
      email: enteredUserEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(function(){
      res.redirect('/signup');
    });

    return;

  }else{
    const hashedPassword = await bcrypt.hash(enteredPassword, 12);

    const user = {
      email: enteredUserEmail,
      password: hashedPassword,
    };

    await db.getDb().collection("users").insertOne(user);

    res.redirect("/login");
  }


});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredUserEmail = userData.email;
  console.log(enteredUserEmail);
  const enteredPassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredUserEmail });
    const validUser = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!existingUser || !validUser) {
    req.session.inputData = {
      hasError:true,
      message:'Incorrect username or password',
      email: enteredUserEmail,
      password: enteredPassword,
    };

    req.session.save(function(){
      res.redirect('/login');
    });

    return;

  } else {
    console.log("valid");
    req.session.user = {id: existingUser.id, email: existingUser.email};
    req.session.isAuthenticated = true;
    req.session.save(function(){
      res.redirect('/profile');
    })
    //return res.redirect("/");
  }
});

router.get("/admin",async function (req, res) {
  if(!req.session.isAuthenticated)
  return res.status(401).render('401');

  const user = await db.getDb().collection('users').findOne({_id: req.session.user.id})

  if(!user || !user.isAdmin){
    return res.status(403).render('403');
  }
  res.render("admin");
});

router.get("/profile", function (req, res) {
  if(!req.session.isAuthenticated)
  return res.status(401).render('401');
  res.render("profile");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;
