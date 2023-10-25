const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  token: String,
  lastname: String,
  firstname: String,
  email: String,
  username: String,
  password: String,
  dons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'objects' }],
  catchs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'objects' }],
  likedObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'objects' }],
});

const User = mongoose.model('users', userSchema);

module.exports = User;
