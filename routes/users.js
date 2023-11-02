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
      "phone",
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
        phone: req.body.phone,
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


// Route côté donneur qui sert à afficher les objets du donneur
router.get("/:token/object", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (user === null) {
      res.json({ result: false, error: "User not found" })
      return;
    }

    const userId = user.id; // Récupérer l'ID de l'utilisateur
    Object.find({ user: userId })
    .populate({path:'likedBy'})
    .then(populatedObjectList => {
      const extractedInfo = populatedObjectList.filter(obj => !obj.caughtBy).map(obj => { // Filtrer les objets sans caughtBy
          const likedUsers =  obj.likedBy.map((user) => {
            return { 
              token: user.token,
              username: user.username,
              phone: user.phone,
              avatar: user.avatar
            };
          });

          return {
            title: obj.title,
            uniqid: obj.uniqid,
            image: obj.image[0],    
            likedBy: likedUsers,
            id: obj.id
          };
        });

      res.json(extractedInfo);
    }) 
  });
});


 // Route côté chineur/dénicheur qui sert à afficher les objets likés par le chineur. 
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
    if (user.likedObjects.length === 5) {
      res.json({ result: false, error: 'Vous avez utilisé tous vos likes' })
      return
    }

    Object.findOne({ _id: req.body.object }).then(object => {
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




router.put('/dislike/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {

    // Si il n'y a pas d'objet on continue pas
    Object.findOne({ _id: req.body.object }).then(object => {
      if (!object) {
        res.json({ result: false, error: 'Object not found' })
        return;
      }
    // la route doit recevoir le token du Donneur et pour modifier le document de l'item = le user à retirer du likedBy et l'item 

      // Supprime l'ID de l'utilisateur de la liste "likedBy" de l'objet.
      object.likedBy = object.likedBy.filter(e => e.toString() !== user.id.toString());
      // console.log(user);

      // ça va sauvegarder l'objet mis à jour.
      object.save().then(savedObject => {
        // Supprime l'ID de l'objet de la liste "likedObjects" de l'utilisateur.
        // On ajoute .toString() pour comparer les valeurs en string
        user.likedObjects = user.likedObjects.filter(e=> e.toString()!== object._id.toString());
        // console.log();

        // ça va sauvegarder l'utilisateur mis à jour.
        user.save().then(savedUser => {
          res.json({ result: true, likedBy: savedObject.likedBy, likedObjects: savedUser.likedObjects })
        });
      });
    });
  });
});



// Route OUI (à enlever en cas de crash)

router.put('/catch/:token', async (req, res) => {
  try {
    // Trouver l'utilisateur par le token
    const user = await User.findOne({ token: req.params.token });

    if (!user) {
      return res.json({ result: false, error: 'User not found' });
    }

    // Trouver l'objet par l'ID
    const object = await Object.findById(req.body.object);

    if (!object) {
      return res.json({ result: false, error: 'Object not found' });
    }

    // Supprimer l'objet de la liste "likedObjects" de tous les utilisateurs qui l'ont aimé
    const usersToUpdate = await User.find({ _id: { $in: object.likedBy } });

    const updatePromises = usersToUpdate.map(async (u) => {
      u.likedObjects = u.likedObjects.filter(likedObjectId => likedObjectId.toString() !== object._id.toString());
      await u.save();
    });

    await Promise.all(updatePromises);

    // Vider la liste "likedBy" de l'objet
    object.likedBy = [];

    // Mettre à jour le champ "caughtBy" de l'objet
    object.caughtBy = user._id;

    user.catchs.push(object.image[0])
    // console.log(user);

    // Enregistrer l'objet mis à jour
    await object.save();

    // Enregistrer l'user mis à jour
    await user.save();


    res.json({
      result: true,
      likedBy: object.likedBy,
      likedObjects: user.likedObjects,
    });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: 'Error occurred' });
  }
});


// -------------------------------------------------------------------------------------



















// router.put('/catch/:token', (req, res) => {
//   User.findOne({ token: req.params.token }).then(user => {

//     // Si il n'y a pas d'objet on continue pas
//     Object.findOne({ _id: req.body.object }).then(object => {
//       if (!object) {
//         res.json({ result: false, error: 'Object not found' });
//         return;
//       }

//       // Supprime tous les utilisateurs de la liste "likedBy" de l'objet.
//       object.likedBy = []
//       // console.log(user);

//       object.caughtBy = user.id

//       // ça va sauvegarder l'objet mis à jour.
//       object.save().then(savedObject => {
//         // Supprime l'ID de l'objet de la liste "likedObjects" de l'utilisateur.
//         // On ajoute .toString() pour comparer les valeurs en string
//         user.likedObjects = user.likedObjects.filter(e=> e.toString()!== object._id.toString());
//         // console.log();

//         // ça va sauvegarder l'utilisateur mis à jour.
//         user.save().then(savedUser => {
//           res.json({ result: true, likedBy: savedObject.likedBy, likedObjects: savedUser.likedObjects });
//         });
//       });
//     });
//   });
// })


























// router.put("/:token/object", (req, res) => {
//   User.findOne({ token: req.params.token }).then((user) => {
//     if (user === null) {
//       res.json({ result: false, error: "User not found" });
//       return;
//     }

//     const userId = user.id; // Récupérez l'ID de l'utilisateur
//     console.log(userId);
//     Object.find({ user: userId })
//     .populate({path:'likedBy'})
//     .then(populatedObjectList => {
//       const extractedInfo = populatedObjectList.map(obj => { // permet de récupérer tous les éléments de la data
//         const likedUsers =  obj.likedBy.map((user) => { // pour de récupérer les éléments nécessaire du tableau likedBy
//           return { 
//             username: user.username,
//             avatar: user.avatar
//           };
//         });
//         return { // ici on créer un objet avec les éléments dont on a besoin
//           title: obj.title,
//           image: obj.image[0],    
//           likedBy: likedUsers
//         };
//       });
//       res.json(extractedInfo)
//     }) 
//     });
//   });




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

router.delete('/delete/:token', (req,res)=>{
  User.deleteOne({token:req.params.token})
  .then(data=> 
  res.json({result:true}))
}



)



module.exports = router

