const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/mail');

//generate jwt function

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV == 'prduction') cookieOptions.secure = true; // sends cookie https otherwise it is sent in http

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

//-----------------------------------Signup function-------------------------

exports.signup = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(user._id);

  createSendToken(user, 201, res);
});

//-----------------Login function----------------------------

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //checking if there are inputs of both- email and pass
  if (!email || !password) {
    const err = new appError('Please provide email and password', 400);
    return next(err);
  }

  // verifyind email and password
  const user = await User.findOne({ email: email }).select('+password');
  let verify = false;

  if (user) verify = await user.checkPassword(password, user.password);

  if (!user || !verify) {
    const err = new appError('Incorrect email id and password !!', 401);
    return next(err);
  }

  const token = signToken(user._id);

  createSendToken(user, 200, res);
});

//---------------------------------------------Logout------------------------------------------------
exports.logout = (req, res) => {
  console.log(1111);
  res.cookie('jwt', 'LoggedOut', {
    expire: new Date(Date.now() + 10000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
  
};

//---------------------------------------------Authenticate function-----------------------------
exports.protect = catchAsync(async (req, res, next) => {
  //1) get token

  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;
  if (!token)
    return next(new appError('You are not logged in, please log in', 401));

  //2) verify token
  const decode = await jwt.verify(token, process.env.JWT_SECRET);

  //3) check if user still exists
  const user = await User.findById(decode.id);
  if (!user) return next(new appError('User no longer exists'), 404);

  //4) check password was not changed after token issued
  if (user.isPasswordModified(decode.iat)) {
    return next(new appError('User recently changed Password'), 401);
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = user;
  //User is logged in give user data to templates
  res.locals.user = user;
  next();
});

//------------------if Logged in-- Only for rendered pages so no error--------------------------
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //1) verify token
      const decode = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      //2) check if user still exists
      const user = await User.findById(decode.id);
      if (!user) return next();

      //4) check password was not changed after token issued
      if (user.isPasswordModified(decode.iat)) {
        return next();
      }

      //User is logged in give user data to templates
      res.locals.user = user;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

//---------------------------------Authorisation-------------------------------------
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new appError('You are not authorised for this action.', 403));
    }

    next();
  };
};

//--------------------------------Forgot Password---------------------------

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user by POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('There is no user with the email', 403));
  }

  //2)Generate random reset token
  const resetToken = user.createPasswordResetToken(); // adds a (passwordResetToken) field to this document
  await user.save({ validateBeforeSave: false });

  //3)Send it to user's mail
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Forgot Password? Make Patch request at: ${resetUrl}.\n If you didn't forget password, please ignore this mail`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Your password reset token. (Valid for 10 minutes)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Resent token sent to the mail'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new appError('Error happened while sending email. Try again later'),
      500
    );
  }
});

//---------------------------------Reset Passowrd------------------------------------------
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get the user based on resettoken
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2) if token has not expired and user exist then change password

  if (!user) {
    return next(
      new appError('Token is invalid  or expired. Please try again!', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  console.log(req.body.password);
  await user.save();

  //3) update the passwordChangedAt field

  // Done in user model by pre save hook (model middleware)

  //log user in, send JWT

  createSendToken(user, 200, res);
});

//---------------------Update Password-----------------------
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection

  // let token = ''
  // if(req.headers.authorization && req.header.authorization.startsWith('Bearer')){
  //   token = req.headers.authorization.split(' ')[1]
  // }

  // if(!token){
  //   return next(new appError('You are not logged in. Please log in', 403))
  // }

  // const decode = jwt.verify(token, process.env.JWT_SECRET)

  // const user = await User.findById( decode.id)
  // if (!user) return next(new appError('User no longer exists'), 404);

  const user = await User.findById(req.user.id).select('+password'); // req.user is made in authentication(protect) function

  //2) Check if POSTed current password is correct
  const verify = await user.checkPassword(
    req.body.currentPassword,
    user.password
  );
  if (verify == false) {
    return next(new appError('Wrong password', 401));
  }

  //3)Update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});
