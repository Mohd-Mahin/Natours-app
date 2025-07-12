const User = require('../models/userModel');
const AppError = require('../utils/AppError');

exports.getAllUser = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

function filterObj(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
}

exports.updateUser = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body || {};

    if (password || confirmPassword) {
      return next(
        new AppError('Change password with update password url', 400),
      );
    }

    const filteredBody = filterObj(req.body, 'name', 'email');

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, {
      active: false,
    });

    if (!user) {
      return next(new AppError('No user found with this ID', 404));
    }

    res.status(204).json({
      status: 'removed',
      message: 'User deleted successfully',
    });
  } catch (error) {
    const err = new AppError(error.message, 404, error);
    next(err);
  }
};
