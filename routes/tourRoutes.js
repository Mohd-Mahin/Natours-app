const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/top-5-cheap',
  tourController.aliasTopTours,
  tourController.getAllTours,
);

router.get('/tour-stats', tourController.getTourStats);
router.get('/monthly-plan/:year', tourController.getMonthlyPlan);

router.get(
  '/top-5-extravagant',
  tourController.aliasTopExtravagant,
  tourController.getAllTours,
);

router
  .route('/')
  .get(authController.authenticate, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.authenticate,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
