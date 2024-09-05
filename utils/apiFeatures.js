class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A)FILTERING
    const queryObj = { ...this.queryString }; // destructures req.query and saves all keys and values in an object..this way queryObj is not a refrence to req.query but and hardcopy of it

    const excludedFields = ['page', 'sort', 'limit', 'fields']; // fields we dont want to make a query about

    excludedFields.forEach((el) => delete queryObj[el]); // deletes excluded fields from queryObj

    //1B)ADVANCED FILTERING

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr)); // returns a query for filtered data..this query then again be chained for things like sort limit page etc

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.replaceAll(',', ' '); // if user gives a sorting parameter

      this.query = this.query.sort(sortBy); // req.query is object sort is a key in it we get from url so we want sort our query based on the sort: value we get from url
    } //
    else this.query = this.query.sort('-createdAt'); //default sorting.. -createdAt sorts based on ealiest doc made..the negative sign reverse order

    return this;
  }

  limitingFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replaceAll(',', ' ');
      this.query.select(fields);
    } //
    else {
      this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
