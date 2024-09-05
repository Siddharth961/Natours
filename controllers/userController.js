const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError')
const factory = require('./handlerFactory')

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
