const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AppError = require('./utils/appError');

dotenv.config({ path: './config.env' });

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

mongoose
  .connect(process.env.DATABASE, {
    dbName: 'natours-app',
  })
  .then((res) => {
    console.log('Connected to database...');
  });

// MIDDLEWARE - 1 - GLOBAL
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// MIDDLEWARE - 2
// app.use((req, res, next) => {
//   console.log('hello from the middleware');
//   next();
// });
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(500).json({
  //   status: 'fail',
  //   message: `Can't find url - ${req.originalUrl} on this server!!!`,
  // });

  // Below code will be thrown to global error handler with error object set as statusCode and status.
  // const error = new Error(
  //   `Can't find url - ${req.originalUrl} on this server!!!`,
  // );
  // error.statusCode = 404;
  // error.status = 'fail 2';

  const error = new AppError(
    `Can't find url - ${req.originalUrl} on this server!!!`,
    404,
  );
  next(error);
});

// Global Error Handler - starting first func - arg as err object.
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Operational|Trusted Error: send message to the client.
  if (err.isOperational) {
    const jsonObj = {};
    if (process.env.NODE_ENV === 'development') {
      jsonObj.status = err.status;
      jsonObj.message = err.message;
      jsonObj.error = err;
      jsonObj.stack = err.stack;
    } else if (process.env.NODE_ENV === 'production') {
      jsonObj.status = err.status;
      jsonObj.message = err.message;
    }
    res.status(err.statusCode).json(jsonObj);
  } else {
    console.error('ERROR: ', err);
    //Programming or other unkown error: don't leak error details
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Listenting on port ${PORT}...`);
});

process.on('unhandledRejection', (error) => {
  console.log('Unhandled Rejection!!! Shutting down...', error);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception!!! Shutting down...', error);
  server.close(() => {
    process.exit(1);
  });
});
