var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const Object = require('../models/objects');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// Route pour l'inscription
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['firstname', 'lastname', 'username', 'password', 'email'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ username: req.body.username }).then(data => {
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

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

// // Route pour la connexion
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: req.body.username }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, firstname: data.firstname, email: data.email, lastname: data.lastname});
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});



// Farid





















 // Route côté chineur/dénicheur
 router.get('/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {
    
    if (!user) {
      res.json({ result: false, error: 'User not found' });
      return;
    } else {
// Le populate permet d'aller récupérer le contenu de likedObjects dans la collection Users.
// Le contenu de likedObjects étant une clé étrangère contenant le schéma objects.
// Le 2ème populate permet d'aller récupérer le contenu du user dans le likedObjects de la collection Users. 
      user.populate({path : 'likedObjects', populate : {path: 'user'}} )
      .then(finalObj =>  {console.log(finalObj)
          res.json({ result: true, finalObj });
      
      });
    }
  });
})

// Ajouter un like
router.put('/like/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {
    if (!user) {
      console.log("Utilisateur non trouvé");
      res.json({ result: false, error: 'Utilisateur non trouvé' });
      return;
    }

    if (!user.likedObj) {
      user.likedObj = [];
    }

    if (user.likedObj.length >= 5) {
      res.json({ result: false, error: 'Vous avez utilisé tous vos likes' });
      return;
    }

    Object.findOne({ _id: req.body.object }).then(object => {
      if (!object) {
        res.json({ result: false, error: 'Objet non trouvé' });
        return;
      }

      if (!object.likedBy) {
        object.likedBy = [];
      }

      if (object.likedBy.length >= 5) {
        res.json({ result: false, error: 'Cet objet a déjà eu le nombre maximum de likes' });
        return;
      }

      object.likedBy.push(user._id);

      object.save().then(savedObject => {
        user.likedObj.push(savedObject._id);
        user.save().then(savedUser => {
          res.json({ result: true, likedBy: savedObject.likedBy });
        }).catch(err => {
          console.log("Erreur lors de l'enregistrement de l'utilisateur:", err);
          res.status(500).json({ result: false, error: 'Erreur lors de l\'enregistrement de l\'utilisateur' });
        });
      }).catch(err => {
        console.log("Erreur lors de l'enregistrement de l'objet:", err);
        res.status(500).json({ result: false, error: 'Erreur lors de l\'enregistrement de l\'objet' });
      });
    }).catch(err => {
      console.log("Erreur lors de la recherche de l'objet:", err);
      res.status(404).json({ result: false, error: 'Objet non trouvé' });
    });
  }).catch(err => {
    console.log("Erreur lors de la recherche de l'utilisateur:", err);
    res.status(404).json({ result: false, error: 'Utilisateur non trouvé' });
  });
});


  module.exports = router;