const mongoose = require('mongoose');

const localisationSchema = mongoose.Schema({
    city: String,
    postalCode: String,
   });

const objectSchema = mongoose.Schema({
    image: [String],
    title: String,
    description: String,
    condition: String,
    localisation: localisationSchema,
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    isLiked: Boolean,
    caughtBy : { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
})

const Object = mongoose.model('objects', objectSchema)

module.exports = Object