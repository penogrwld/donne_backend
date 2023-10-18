const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  token: String,
  lastname: String,
  firstname: String,
  email: String,
  username: String,
  password: String,
  //canDelete: Boolean,
});

const User = mongoose.model('users', userSchema);

module.exports = User;
