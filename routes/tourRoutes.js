const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// router.param('id', tourController.CheckId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTour);

//AGGREGATION PIPELINE ROUTES
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.monthlyPlan
  );

router.get('/tours-within/:distance/center/:latlng/unit/:unit' ,tourController.getTourWithin)
router.get('/distances/center/:latlng/unit/:unit' ,tourController.getDistances)
router
  .route('/')
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.CreateTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.UpdateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.DeleteTour
  );

// Nesting Review routes

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
