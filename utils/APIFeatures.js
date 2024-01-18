class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Build a query
    // [1] Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    // [2] Advance Filtering
    // { difficulty: 'easy', duration: { $gte: 5 }}
    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`),
    );

    this.query = this.query.find(queryStr);
    // let query = Tour.find(queryStr);
  }

  sort() {
    //[3] Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort("price ratingsAverage") accept comma seprated value
    }
    // else {
    //   this.query = this.query.sort('-createdBy');
    // }
  }

  projection() {
    // [4] Field Limit || Projection
    if (this.queryString.fields) {
      const fieldStr = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldStr);
    } else {
      this.query = this.query.select('-__v'); // remove from the response json
    }
  }

  paginate() {
    // [5] Pagination (skip=10&limit=10) > page 2
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
  }
}

module.exports = APIFeatures;
