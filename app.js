const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  passport = require('passport'),
  mongoose = require('mongoose'),
  port = process.env.PORT || 4040,
  expressLayouts = require('express-ejs-layouts');
require('dotenv').config();
const { key_DB } = require('./config/keys');
const flash = require('connect-flash');

const methodOverride = require('method-override');
const app = express();
require('./config/passport')(passport);

app.use(morgan('dev'));

app.use(methodOverride('_method'));

mongoose.connect(
  key_DB,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  },
  (err, success) => {
    if (err) throw err;
    console.log('db connected successfully');
  }
);

app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));
app.use(express.static('uploads'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect flash
app.use(flash());

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', require('./routes'));

app.listen(port, () => console.log(`server running on port ${port}`));
