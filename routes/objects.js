var express = require('express');
var router = express.Router();

require('../models/connection');
const uniqid = require('uniqid');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const User = require('../models/users');
const Object = require('../models/objects')
const { checkBody } = require('../modules/checkBody');


      // Ajouter une photo 
      router.post('/upload', async (req, res) => {
        const photoPath = `./tmp/${uniqid()}.jpg`;
        const resultMove = await req.files.photoFromFront.mv(photoPath);
        
        if (!resultMove) {
            const resultCloudinary = await cloudinary.uploader.upload(photoPath);
            res.json({ result: true, url: resultCloudinary.secure_url  });      
           } else {
               res.json({ result: false, error: resultMove });
           }
           fs.unlinkSync(photoPath);
       });


// Ajouter un objet à donner
router.post('/add',(req,res)=> {
    // Vérifier si tous les champs à remplir sont bien renseignés
    if (!checkBody(req.body, ['image', 'title', 'description', 'localisation', 'condition'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
      }

      User.findOne({ token: req.body.token }).then(user => {
        const newObject = new Object({
            image: req.body.image,
            title: req.body.title,
            description: req.body.description,
            condition: req.body.condition,
            localisation: {
                city: req.body.localisation.city,
                postalCode: req.body.localisation.postalCode
            },
            user: user._id,
            likedBy: null,
            caughtBy: null
          })
          newObject.save().then(newDoc => {
              res.json({ result: true, don: newDoc})
          })
})
})

module.exports = router;