const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  token: String,
  avatar: String,
  lastname: String,
  firstname: String,
  phone: Number,
  email: String,
  username: String,
  password: String,
  dons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'objects' }],
  catchs: [String],
  likedObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'objects' }],
});

const User = mongoose.model('users', userSchema);

module.exports = User;