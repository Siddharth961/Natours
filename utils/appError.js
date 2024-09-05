class AppError extends Error {
  constructor(message, statusCode) {
    
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    // console.log(this.statusCode)
  }

}

module.exports = AppError;
