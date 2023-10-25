var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Object = require("../models/objects");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// Route pour l'inscription
router.post("/signup", (req, res) => {
  if (
    !checkBody(req.body, [
      "firstname",
      "lastname",
      "username",
      "password",
      "email",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ username: req.body.username }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.username,
        password: hash,
        token: uid2(32),
        // canDelete: true,
      });

      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

// // Route pour la connexion
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, firstname: data.firstname });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    const userId = user.id; // Récupérez l'ID de l'utilisateur
    console.log(userId);
    Object.find({ user: userId })
    .populate({path:'likedBy'})
    .then(populatedObjectList => console.log(populatedObjectList[0].likedBy[0].email))
    
    } );


  
});

module.exports = router;
