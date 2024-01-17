const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

dotenv.config({ path: './config.env' });

const app = express();

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    dbName: 'natours-app',
  })
  .then((res) => {
    console.log('Connected to database...');
    const tourSchema = new mongoose.Schema({
      name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
      },
      rating: {
        type: Number,
        default: 4.5,
      },
      price: {
        type: Number,
        required: [true, 'A tour must have a price'],
      },
    });

    const Tour = mongoose.model('Tour', tourSchema);
    const testTour = new Tour({
      name: 'The Forest Hikers',
      rating: 4.5,
      price: 300,
    });

    testTour.save();
  });

// middleware
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listenting on port ${PORT}...`);
});
