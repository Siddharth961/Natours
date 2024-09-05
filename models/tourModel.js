const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
const validator = require('validator');

//Schema and Validators
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less than or equal to 40 characters'],
      minlength: [10, 'A tour must have more than or equal to 10 characters']
      //Got rid of next line cause this validator rejects spaces too in a string
      //validate: [validator.isAlpha, 'Tour name must contain only alphabets' ]// here we have used "validator" the np package
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //validator only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Invalid Difficulty'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater than eqaul to 1'],
      max: [5, 'Rating must be less than eqaul to 5'],
      set: val => Math.round( val*10 )/10
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // here we have used "validator" the keyword

          //val is the value given for this field
          //this refers to document for which validation is being ran
          //hence this only refers to a document when a new document is made so if the request is to update a document this dont work
          return val < this.price;
        },
        message: 'Discount should be less than price' //message given if validator has value false
      }
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },

    description: {
      type: String,
      trim: true
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover']
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false //hides this field when data is requested
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false
      // select: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      },
      address: String,
      description: String
    },

    //embedded document
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: {
          type: [Number]
        },
        address: String,
        description: String,
        day: Number
      }
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true }, // to allow virtual fields to be sent
    toObject: { virtuals: true }
  }
);

// tourSchema.index({price : 1}) // adding index to model
tourSchema.index({ price: 1, ratingsAverage: -1 }); //adding a compound index to model
tourSchema.index({ slug : 1});

tourSchema.index({ startLocation : '2dsphere'}) // geolocation queries need index..hence adding index

tourSchema.virtual('durationWeeks').get(function () {
  //this is to create virtual fields(fields that are not actually stored in db)
  return this.duration / 7; //simple function is used cause arrow function dont have "this" property
});

//Virtual populate

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//-----DATABASE MIDDLEWARE------

//DOCUMENT MIDDLEWARE

tourSchema.pre('save', function (next) {
  //NOTE ----> SAVE ACTION ONLY TRIGGERS ON .save() and .create..not on insetMany() and others
  this.slug = slugify(this.name, { lower: true }); // here this refers to the document created
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('-------the next pre middleware-------');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY DOCUMENT

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //here this refers to the query
  this.start = Date.now(); // setting a property in query object -- the QUERY OBJECT NOT in the DOCUMENTS--a query object is till a simple object afterall
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log('----------post query middleware----');
  console.log(`Query took ${Date.now() - this.start} milliseconds`); //here this still refers to the query
  //console.log(doc); // we get access to documents returned from query executed
  next();
});

//AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //this refres to the aggregate object....unshift is used to insert at first in array
//   console.log(this.pipeline()); //the pipeline() contains the array we sent in aggregrate
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
