const express = require('express');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');

const app = express();
app.use(cookieParser())


app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
  next(); 
})
// STUFF BEFORE STARTING

// app.get('/',(req,res)=>{
  //    // res.status(200).send('hello from server')
  //     //KEY POINT .SEND CALLS .WRITE FOLLOWED BY .END SO OTHER RES. CALL WONT WORK AFTER IT AS BY .END IT CLOSSES THE REQUEST
  
  //     //res.write("Hello Bunny");
  //     //res.end()
  
  //     res.json({message : "loveee youuuu", ps : "hehehehe"})
  // })
  
  // app.post('/', (req,res)=>{
    //     res.send(`This is post response`)
    // })
    
    //ENDD OF STUFF BEFORE START
    
    //START
    
    // Setting up pug
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));
    
//---------------MAKING MIDDLEWARE---------

//-----serving static files-----
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
app.use(helmet({ contentSecurityPolicy: false }));

//Rate Limiter Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //WindowMs is window size in milli seconds
  limit: 100,
  message: 'Too many request from this IP, please try again after 15 minutes'
});

app.use(limiter);

//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parser - reading data from req into req.body
app.use(express.json({ limit: '10kb' })); //set limit on how much data can be sent

// to access data coming from url encoded forms
app.use(express.urlencoded({
  extended : true,
  limit : '10kb'
}))

//Sanitise incoming data from NoSQL query injection
app.use(mongoSanitizer());

//Santize incoming data agains XSS
app.use(xss());

// prevention again http-parameter-pollution (hpp)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'maxGroupSize',
      'difficulty'
    ]
  })
);

//NOTE THAT MIDDLE WARE SHOULD BE DEFINED BEFORE CALLING THE ROUTE OTHERWISE THE CONTROL MAY NOT REACH THE MIDDLE WARE

app.use((req, res, next) => {
  req.body.requestTime = new Date().toISOString(); //creating requestime object
  console.log(req.body.requestTime);

  next();
});

// -----------ROUTES METHOD CALLED--------

// app.get('/api/v1/tours', getAllTour);
// app.get('/api/v1/tours/:id', getTour);
// app.post("/api/v1/tours" , CreateTour);
// app.patch('/api/v1/tours/:id', UpdateTour);
// app.delete('/api/v1/tours/:id', DeleteTour);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//to handle wrong/unwanted requests
app.all('*', (req, res, next) => {
  // res.status(404).send({
  //   status : 'fail',
  //   message : `Can't find '${req.originalUrl}' on server`
  // })

  const err = new appError(`Can't find '${req.originalUrl}' on server`, 404);

  next(err);
});

app.use(errorHandler);

module.exports = app;
