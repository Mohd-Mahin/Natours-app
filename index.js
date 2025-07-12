const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const AppError = require('./utils/AppError');

dotenv.config({ path: './config.env' });

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// global middleware
// 1. Security HTTP headers
app.use(helmet());

mongoose
  .connect(process.env.DATABASE, {
    dbName: 'natours-app',
  })
  .then((res) => {
    console.log('Connected to database...');
  });

// limit requests from same API: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests from this IP, please try again in an hour!',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// MIDDLEWARE - 1 - GLOBAL - Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
// body parser, serving static files, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// serving static files
app.use(express.static(`${__dirname}/public`));

app.use(xss());
app.use(mongoSanitize());

// MIDDLEWARE - 2  Test middleware
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
      jsonObj.error = err;
      jsonObj.stack = err.stack;
      jsonObj.message = err.message;
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
