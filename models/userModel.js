const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: (props) =>
        `${props.value} is not a valid email. Please provide a valid email`,
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: 8,
  },
  confirmPassword: {
    type: String,
    required: [true, 'A user must have a confirm password'],
    minLength: 8,
    validate: {
      // this only works  save or create
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete confirmPassword from database - not save to database - only for validation
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  hashedPassword,
) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // storing the encrypted token in the database
  // sending the token to the user's email
  return resetToken;
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// The following code ensures that the password field is removed from user objects
// whenever they are converted to JSON (e.g., when sending a response) or to plain objects.
// This helps keep the password hidden from API responses.

// The transform function is called automatically by Mongoose when .toJSON() or .toObject() is used.
// It receives the document (doc) and the returned object (ret).
// We delete ret.password so it does not appear in the output.

// Order of execution:
// 1. When a user document is created or fetched from the database, it contains all fields, including password.
// 2. When you send the user as a response (e.g., res.json({ user })), Mongoose calls .toJSON() on the document.
// 3. The transform function defined above is executed, removing the password field from the output.
// 4. The resulting object, without the password, is sent in the API response.

userSchema.set('toJSON', {
  transform: function (doc, ret, _) {
    delete ret.password;
    delete ret.active;
    delete ret.passwordChangedAt;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: function (doc, ret, _) {
    delete ret.password;
    delete ret.active;
    delete ret.passwordChangedAt;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
