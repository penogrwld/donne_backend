var express = require('express');
var router = express.Router();

require('../models/connection');
const uniqid = require('uniqid');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const User = require('../models/users');
const Object = require('../models/objects')
const { checkBody } = require('../modules/checkBody');

// Ajouter un objet à donner
router.post('/',async (req,res)=> {
    // Vérifier si tous les champs à remplir sont bien renseignés
    if (!checkBody(req.body, ['image', 'title', 'condition', 'user', 'localisation'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
      }
      // Ajouter une photo 
      const photoPath = `./tmp/${uniqid()}.jpg`;
      const resultMove = await req.files.photoFromFront.mv(photoPath);
      
      if (!resultMove) {
          const resultCloudinary = await cloudinary.uploader.upload(photoPath);
          const newObject = new Object({
              image: resultCloudinary.secure_url,
              title: req.body.title,
              description: req.body.description,
              localisation: req.body.localisation,
              user: req.body.user,
              isLiked: false,
              caughtBy: null
            })
            newObject.save().then(newDoc => {
                res.json({ result: true, newDonation: newDoc})
            })
            fs.unlinkSync(photoPath);
}})


module.exports = router;