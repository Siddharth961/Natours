const AppError = require('../utils/appError');

const sendErrDev = (err, req, res) => {
  if(req.originalUrl.startsWith('/api') ){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });

  }
  else{
    res.status(err.statusCode).render('error', {

      title : 'Something went wrong!',
      msg : err.message
    })
  }
};

const handleCastErrDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;

  return new AppError(message, 404);
};

const handleDuplicateFeildsDB = (err) => {
  const message = `Duplicate field value : '${err.keyValue.name}'. Select other value`;
  return new AppError(message, 400);
};

const handleValidationErrDB = (err) => {
  let errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 404);
};

const handle_JWT_Validation = (err) =>
  new AppError('Invalid token. Please log in again', 401); //returns new AppError

const handle_JWT_Expire = (err) =>
  new AppError('Token expired. Please log in again', 401); // returns new AppError

const sendErrProd = (err, req, res) => {

  if(req.originalUrl.startsWith('/api')){
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // console.log(err);
      res.status(500).send('Something went wrong!');
    }

  }
  else{
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {

        title : 'Something went wrong!',
        msg : err.message
      })
    } else {
      res.status(err.statusCode).render('error', {

        title : 'Something went wrong!',
        msg : 'Please try again later'
      })
    }
  }
};

module.exports = (err, req, res, next) => {
  // console.log('-----------------------------------Error Stackk-----------------------------')
  // console.log(err.stack)
  err.statusCode = err.statusCode || 500;
  console.log(
    'Error happend -- Global error handler-------in error controller'
  );

  if (process.env.NODE_ENV == 'development') {
    sendErrDev(err, req, res);

    //blank
  } else if (process.env.NODE_ENV == 'production') {
    let  error  = err;
    
    // console.log(error.name, err.name);

    if (error.name == 'CastError') {
      error = handleCastErrDB(error);
    }

    if (error.code == 11000) error = handleDuplicateFeildsDB(error);

    if (err.name == 'ValidationError') error = handleValidationErrDB(error);

    if (err.name == 'JsonWebTokenError') error = handle_JWT_Validation(error);

    if (err.name == 'TokenExpiredError') error = handle_JWT_Expire(error);

    sendErrProd(error, req, res);
  }
};
