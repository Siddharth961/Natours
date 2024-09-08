const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter name !']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowecase: true,
    validate: [validator.isEmail, 'Provide valid email']
  },

  photo: {
    type : String,
    default : 'default.jpg'
  },

  role: {
    type: String,
    enum: ['user', 'guide', 'tour-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide Password'],
    minlength: 8,
    select: false
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please conform Password'],
    validate: {
      validator: function (val) {
        if (val == this.password) return true;
        else return false;
      },
      message: 'Please enter same Password'
    }
  },

  passwordChangedAt: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // so that jwt.iat is not less that passwordChangedAt
  next();
});

//----filter out docs with active = false in all find query. Hence use query middleware
//
userSchema.pre(/^find/, async function (next) {
  //this refers to current query
  this.find({ active: { $ne: false } }); // it basically added another query before called query----so first this query is executed and then called query is executed on result from this query

  next();
});

//.methods attach a method(function) to each document -----it is called instance method
userSchema.methods.checkPassword = async function (candidate, userPassword) {
  return await bcrypt.compare(candidate, userPassword);
};

userSchema.methods.isPasswordModified = function (time) {
  if (this.passwordChangedAt) {
    const changedToTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); // divided by thousand to covert millisec to secs

    return time < changedToTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
