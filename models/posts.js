const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: Date, default: new Date() }
});

const loginSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const Posts = mongoose.model('Posts', postsSchema);
const Login = mongoose.model('Login', loginSchema);

module.exports = { Posts, Login };
