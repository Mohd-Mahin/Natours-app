const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../utils/email');

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_TOKEN, {
    expiresIn: '180d',
  });
}

function createSendToken(user, statusCode, res) {
  const token = createToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;
    const user = await User.create({
      name,
      email,
      password,
      role,
      confirmPassword,
    });

    createSendToken(user, 201, res);
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

    createSendToken(user, 200, res);
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
    if (!token || token === 'null') {
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

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const err = new AppError(
        'You do not have permission to perform this action',
        403,
      );
      return next(err);
    }
    next();
  };

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
  // 2) Generate a random token
  // 3) Save the hashed token to the user's document in the database
  // 4) Send the token to the user's email
  // 5) Send response
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    const isPasswordCorrect = await user.correctPassword(
      req.body.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      // return next(new AppError('Existing password is incorrect', 401));
      res.status(401).json({
        token: req.headers.authorization.split(' ')[1],
        message: 'Existing password is incorrect',
      });
      return;
    }

    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};
