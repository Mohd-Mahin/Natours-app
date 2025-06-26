const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_TOKEN, {
    expiresIn: '180d',
  });
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const user = await User.create({
      name,
      email,
      password,
      confirmPassword,
    });

    const token = createToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne({ email });

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = createToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    // getting token and check if it's there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new AppError('Please login to get access', 401));
    }

    // verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_TOKEN);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('User no longer exists', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    const err = new AppError(error.message, 400, error);
    next(err);
  }
};
