const mongoose = require('mongoose');

const localisationSchema = mongoose.Schema({
    city: String,
    postalCode: String,
    latitude: String,
    longitude: String,
   });

const objectSchema = mongoose.Schema({
    uniqid: String,
    image: [String],
    title: String,
    description: String,
    condition: String,
    localisation: localisationSchema,
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    caughtBy : { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
})

const Object = mongoose.model('objects', objectSchema)

module.exports = Object
