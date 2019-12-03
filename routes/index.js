const router = require('express').Router();
const { Posts, Login } = require('../models/posts');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const testimonials = require('../testimonials.json');
const hogan = require('hogan.js');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

require('dotenv').config();

const template = fs.readFileSync('routes/' + 'email.hjs', 'utf-8');
const compiled = hogan.compile(template);

function makeid(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  //name file using unique ID
  filename: function(req, file, cb) {
    if (file.mimetype === 'image/jpeg') {
      cb(null, Math.floor(Math.random() * 100) + makeid(15) + '.jpg');
    } else {
      cb(null, Math.floor(Math.random() * 100) + makeid(15) + '.png');
    }
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

router.get('/', forwardAuthenticated, (req, res) => {
  Posts.find({}, (err, data) => {
    if (err) throw err;
    res.render('home', { testimonials, data });
  });
});

router.get('/contact', forwardAuthenticated, (req, res) => {
  res.render('contact');
});

router.post('/contact', (req, res) => {
  const { fname, lname, email, subject, message } = req.body;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'nyatindopatrick@gmail.com',
    from: 'support@dantours.co.ke',
    subject: subject,
    // text: 'and easy to do anywhere, even with Node.js',
    html: compiled.render()
  };
  sgMail.send(msg).then(res.redirect('/contact'));
});

router.get('/blog', forwardAuthenticated, (req, res) => {
  Posts.find({}, (err, data) => {
    if (err) throw err;
    res.render('blog', { data });
  });
});

router.get('/new/blog', ensureAuthenticated, (req, res, next) => {
  res.render('newblog');
});

router.post('/new/blog', upload.single('image'), (req, res) => {
  console.log(req.body);
  const newBlog = new Posts({
    ...req.body,
    body: req.body.body.trim(),
    image: req.file.path.substring(8)
  });
  newBlog.save((err, data) => {
    if (err) throw err;
    res.redirect('/admin/blog');
  });
});

router.put('/blog/:id', (req, res) => {
  const id = req.params.id;
  const { title, body, image } = req.body;
  Posts.findByIdAndUpdate(
    { _id: id },
    { title: title, body: body },
    (err, message) => {
      if (err) throw err;
      res.send('updated sucessfully');
    }
  );
});

router.delete('/blog/:id', (req, res) => {
  const id = req.params.id;
  const img = req.body.image;
  fs.unlinkSync(path.join('uploads/' + img), function(err) {
    if (err) throw err;
    return;
  });
  Posts.findByIdAndDelete({ _id: id }, (err, message) => {
    if (err) throw err;
    res.redirect('/admin/blog');
  });
});

router.get('/admin/blog/:id', ensureAuthenticated, (req, res, next) => {
  const id = req.params.id;
  Posts.findOne({ _id: id }, (err, blog) => {
    if (err) throw err;
    res.render('editBlog', { blog });
  });
});

router.post('/admin/register', (req, res) => {
  const newUser = new Login(req.body);
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save((err, data) => {
        if (err) throw err;
        res.send(data);
      });
    });
  });
});

router.get('/admin/blog', ensureAuthenticated, (req, res, next) => {
  Posts.find({}, (err, data) => {
    if (err) throw err;
    res.render('adminBlog', { data });
  });
});

router.get('/admin/login', forwardAuthenticated, (req, res) => {
  res.render('login');
});

router.post('/admin/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/new/blog',
    failureRedirect: '/admin/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/admin/login');
});

module.exports = router;
