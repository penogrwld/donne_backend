var express = require('express');
var router = express.Router();

require('../models/connection');
const uniqid = require('uniqid')

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const User = require('../models/users');
const Object = require('../models/objects')
const { checkBody } = require('../modules/checkBody');
const geolib = require('geolib');


      // Ajouter une photo 
      router.post('/upload', async (req, res) => {
        const photoPath = `/tmp/${uniqid()}.jpg`;
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
            uniqid: uniqid(),
            image: req.body.image,
            title: req.body.title,
            description: req.body.description,
            condition: req.body.condition,
            localisation: {
                city: req.body.localisation.city,
                postalCode: req.body.localisation.postalCode,
                latitude: req.body.localisation.latitude,
                longitude: req.body.localisation.longitude
            },
            user: user._id,
            caughtBy: null
          })
          newObject.save().then(newDoc => {
              res.json({ result: true, don: newDoc})
          })
})
});



// YOAN 
// route qui affiche les objets en BDD dans le carrousel

router.get('/:token/:latitude/:longitude', (req, res) => {
    User.findOne({ token: req.params.token }).then(user => {
            Object.find().then(data => {
                const filteredData = data.filter(obj => 
                    obj.likedBy &&
                    obj.likedBy.length < 5 &&
                    obj.user && obj.user.toString() !== user._id.toString() &&
                    obj.localisation && obj.localisation.latitude && obj.localisation.longitude
                    && !obj.likedBy.includes(user._id)
                );                
                // Récupérer les coordonnées de localisation de l'utilisateur depuis les params 
                const userCoordinates = {
                    latitude: req.params.latitude,
                    longitude: req.params.longitude
                };
                
                // Filtre supplémentaire pour la distance (10 km)
                const maxDistance = 10000; // 10 km en mètres
                const filteredDataWithDistance = filteredData.filter(obj => {
                    const objCoordinates = {
                        latitude: obj.localisation.latitude,
                        longitude: obj.localisation.longitude
                    };
                    const distance = geolib.getDistance(userCoordinates, objCoordinates);
                    return distance <= maxDistance;
                });

                res.json({ result: filteredDataWithDistance });
            });
        });
});

    // data.likedBy.map
    // .then(finalObj =>  {console.log(finalObj)


module.exports = router;