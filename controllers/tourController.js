const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//-----------DEFINING ROUTES METODS----------------

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage price';
  req.query.fields = 'name price ratingsAverage duration';

  next();
};

exports.getAllTour = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.CreateTour = factory.createOne(Tour);

exports.UpdateTour = factory.updateOne(Tour);

exports.DeleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 }
      }
    },
    {
      $group: {
        _id: '$difficulty', //forms groups based on id value
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
    // {
    //   $match : {
    //     _id : {$ne : 'easy'}
    //   }
    // }
  ]);

  res.status(201).json({
    status: 'success',
    stat: stats
  });
});

exports.monthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //if the field have an array of values then unwind breaks the array and effectively makes new documents for each value------ for example-- if a document { key : [v1,v2,v3] } then after unwind  documents are [ {key : v1}, {key : v2}, {key : v3}]
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // groups based on the month value of dates..so all tours of jan are placed in one group and so on
        numTour: { $sum: 1 },
        tours: { $push: '$name' } //push is used to create array
      }
    },
    {
      $addFields: { month: '$_id' } // to add new field (NOT IN DATABASE)
    },
    {
      $project: {
        _id: 0 // if a field has value = 0 then it wont be projected
      }
    },
    {
      $sort: {
        numTour: -1 // -1 for desecnding , 1 for ascending
      }
    }
  ]);

  res.status(201).json({
    status: 'success',
    results: plan.length,
    plan: plan
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError('Please provide latitude and longitude in format - lat, lng', 400)
    );
  }

  const radius = unit == 'km' ? distance / 6378.1 : distance / 3963.2; // mogoDB expects radius to be radians hence the conversion....second coversion is for miles

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError('Please provide latitude and longitude in format - lat, lng', 400)
    )
  }

  const multiplier = unit == 'km' ? 0.001 : 0.000621371; // mogoDB expects radius to be radians hence the conversion....second coversion is for miles

  const distances = await Tour.aggregate([
    {
      $geoNear : {
        near: {
          type : 'Point',
        coordinates : [lng*1, lat*1]
        },
        distanceField : 'distance',
        distanceMultiplier : multiplier
      },
       
    },
    {
      $project : {
        distance : 1,
        name : 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    result : distances.length,
    data: {
      data: distances
    }
  });
});
