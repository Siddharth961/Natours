const multer = require('multer')
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError')
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.diskStorage({
  destination : (req, file, cb) => {
    cb(null, 'public/img/users')
  },
  filename : (req, file, cb) => {
    const ext = file.mimetype.split('/')[1]
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
  }
})

const multerFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true)
  }
  else{
    cb( new AppError('Not an Image, please upload an image.', 400))
  }
}

const upload = multer({
  storage : multerStorage,
  fileFilter : multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

const filterObj = (obj, ...allowedFields)=>{
  const newObj = {}
  Object.keys(obj).forEach( el =>{
    if(allowedFields.includes(el)) newObj[el]=  obj[el]
  })
  
  return newObj
}

exports.getMe = (req, res, next)=>{
  req.params.id = req.user.id
  next()
}

//--------------------------Update current user but not its password--------------------------
exports.updateMe = catchAsync(async(req,res,next)=>{
  if(req.body.password ||  req.body.passwordConfirm){
    return next(new appError('To change password use route /updateMyPassword/',400))
  }
  
  const filteredBody = filterObj(req.body, 'name', 'email')
  if(req.file) filteredBody.photo = req.file.filename
  
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new : true,
    runValidators : true
  })
  
  res.status(200).json({
    status : 'success',
    data : {
      user
    }
  })
  
})


//----------------------Delete(Inactive) the current user-------------
exports.deleteMe = catchAsync(async (req,res)=>{
  await User.findByIdAndUpdate(req.user.id, {active : false})
  res.status(204).json({
    status : 'message',
    data : null
  })
})


exports.CreateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined, please use /signup instead'
  });
};

exports.getUser = factory.getOne(User)

exports.getAllUser = factory.getAll(User)

// DO NOT update password with this
exports.UpdateUser = factory.updateOne(User)

exports.DeleteUser = factory.deleteOne(User)

// -----------ROUTES METHOD DEFINED--------
