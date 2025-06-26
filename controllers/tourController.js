const Tour = require('../models/tourModels');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.aliasTopExtravagant = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-price,-ratingAverage';
  next();
};

exports.getAllTours = async (req, res, next) => {
  try {
    // execute a query
    const features = new APIFeatures(Tour.find(), req.query);
    features.filter();
    features.sort();
    features.projection();
    features.paginate();

    const tours = await features.query;
    // chain all the filter, sort and other methods then finally execute it with awaiting the query object.

    res.status(200).json({
      status: 'success',
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findById(id);

    if (!tour) {
      return next(new AppError('No tour found with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 400, error);
    next(err);
  }
};

exports.createTour = async (req, res, next) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 400, error);
    next(err);
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return a new document
      runValidators: true,
    });

    if (!updatedTour) {
      return next(new AppError('No tour found with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        updatedTour,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 400, error);
    next(err);
  }
};

exports.deleteTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findByIdAndDelete(id);

    if (!tour) {
      return next(new AppError('No tour found with this id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

// Pipeline Aggregation
exports.getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: {
            $gte: 4.5,
          },
        },
      },
      {
        $group: {
          _id: {
            $toUpper: '$difficulty',
          },
          // _id: '$ratingsAverage',
          averageRating: {
            $avg: '$ratingsAverage',
          },
          count: {
            $sum: 1,
          },
          avgPrice: {
            $avg: '$price',
          },
          minPrice: {
            $min: '$price',
          },
          maxPrice: {
            $max: '$price',
          },
          numRating: {
            $sum: '$ratingsQuantity',
          },
          tours: {
            $push: '$name',
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $project: {
          minPrice: 0, // 0 will exclude it and 1 will include it
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

// busy month of the year.
exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: {
          path: '$startDates',
        },
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            $month: '$startDates',
          },
          toursCount: {
            $sum: 1,
          },
          names: {
            $push: '$name',
          },
        },
      },
      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $limit: 19,
      },
    ]);
    res.status(200).json({
      status: 'success',
      result: plan.length,
      data: {
        plan,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};
