var express = require("express");
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const Object = require('../models/objects');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

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
        avatar: null,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
        password: hash,
        token: uid2(32),
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

// Route pour la connexion
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, avatar: data.avatar, firstname: data.firstname, email: data.email, lastname: data.lastname});
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});



// Farid


router.get("/:token/object", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    const userId = user.id; // Récupérez l'ID de l'utilisateur
    Object.find({ user: userId })
    .populate({path:'likedBy'})
    .then(populatedObjectList => {
      const extractedInfo = populatedObjectList.map(obj => { // permet de récupérer tous les éléments de la data
        const likedUsers =  obj.likedBy.map((user) => { // pour de récupérer les éléments nécessaire du tableau likedBy
          return { 
            username: user.username,
            avatar: user.avatar
          };
        });
        return { // ici on créer un objet avec les éléments dont on a besoin
          title: obj.title,
          image: obj.image[0],    
          likedBy: likedUsers
        };
      });
      res.json(extractedInfo)
    }) 
    });
  });

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
      res.json({ result: false, error: 'Utilisateur non trouvé' })
      return
    }

    if (user.likedObjects.length === 5) {
      res.json({ result: false, error: 'Vous avez utilisé tous vos likes' })
      return
    }

    Object.findOne({ _id: req.body.object }).then(object => {
      if (!object) {
        res.json({ result: false, error: 'Objet non trouvé' })
        return;
      }


      if (object.likedBy.length >= 5) {
        res.json({ result: false, error: 'Cet objet a déjà eu le nombre maximum de likes' })
        return;
      }

      object.likedBy.push(user._id)

      object.save().then(savedObject => {
        user.likedObjects.push(savedObject._id)
        user.save().then(savedUser => {
          res.json({ result: true, likedBy: savedObject.likedBy })
        })
      })
    })
  })
})

router.put('/unlike/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {

    // Si il n'y a pas d'user on continue pas
    if (!user) {
      console.log('User not found');
      res.json({ result: false, error: 'User not found' });
      return;
    }

    // Si il n'y a pas d'objet on continue pas
    Object.findOne({ _id: req.body.object }).then(object => {
      if (!object) {
        res.json({ result: false, error: 'Object not found' });
        return;
      }

      // Supprime l'ID de l'utilisateur de la liste "likedBy" de l'objet.
      object.likedBy = object.likedBy.filter(e => e.toString() !== user.id.toString());
      // console.log(user);

      // ça va sauvegarder l'objet mis à jour.
      object.save().then(savedObject => {
        // Supprime l'ID de l'objet de la liste "likedObjects" de l'utilisateur.
        // On ajoute .toString() pour comparer les valeurs en string
        user.likedObjects = user.likedObjects.filter(e=> e.toString() !== object.id.toString());
        // console.log();

        // ça va sauvegarder l'utilisateur mis à jour.
        user.save().then(savedUser => {
          res.json({ result: true, likedBy: savedObject.likedBy });
        });
      });
    });
  });
});




router.put('/avatar/:token', (req, res) => {
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (user === null) {
        res.status(404).json({ result: false, error: "User not found" });
        return;
      }

      user.avatar = req.body.avatar; 

      user.save()
        .then((savedUser) => {
          if (savedUser) {
            res.json({ result: true });
          }
        })
    })
});

router.put('/remove/:token', (req,res)=> {
  User.findOne({ token: req.params.token })
  .then(user => {
    if(!user) {
      res.status(404).json({ result: false, error: "User not found" });
        return;
    }
    user.avatar = null
    user.save()
  })
})


module.exports = router

