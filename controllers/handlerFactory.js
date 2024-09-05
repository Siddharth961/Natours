const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // const tour = await Tour.find({ _id: req.params.id });

    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (doc == null)
      return next(new appError('No document with given ID', 404));

    res.status(200).json({
      status: 'success',

      data: {
        doc
      }
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Allow nested routes (tour/review)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //MAKE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .sort()
      .filter()
      .limitingFields()
      .pagination();

    //EXECUTE QUERY

    const docs = await features.query;

    //RESPONSE
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        data: docs
      }
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.

      runValidators: true //important as it reruns the validators otherwise document will be inserted as it is
    });

    if (doc == null)
      return next(new appError('No document with given ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (doc == null)
      return next(new appError('No document with given ID', 404));

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });
