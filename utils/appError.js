module.exports = class AppError extends Error {
  constructor(message, statusCode, originalError) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.name = originalError.name || this.constructor.name;

    Object.assign(this, originalError);
    Error.captureStackTrace(this, this.constructor);
  }
};
