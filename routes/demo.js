const express = require("express");

const db = require("../data/database");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
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
    return res.redirect('/signup');
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredUserEmail 
  });

  if(existingUser){
    console.log('user already exist');
    return res.redirect('/signup');

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
    console.log("incorrect email or password");
    return res.redirect("/login");
  } else {
    console.log("valid");
    return res.redirect("/");
  }
});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
