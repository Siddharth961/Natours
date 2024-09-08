const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//----------Defined in auth controller---------------
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); // embedding this middleware here as all routes after this needs authentication

router.patch('/updateMyPassword', authController.updatePassword);
//----------------Ending--------------------

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')) // all routes from here needs authorization
router
  .route('/')
  .get(userController.getAllUser)
  .post(userController.CreateUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.UpdateUser)
  .delete(userController.DeleteUser);

module.exports = router;
