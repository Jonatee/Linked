class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(payload, options = {}) {
    return this.model.create([payload], options).then((docs) => docs[0]);
  }

  findOne(filter, projection = null) {
    return this.model.findOne(filter, projection);
  }

  findMany(filter, projection = null, options = {}) {
    return this.model.find(filter, projection, options);
  }

  updateOne(filter, update, options = {}) {
    return this.model.findOneAndUpdate(filter, update, { new: true, ...options });
  }

  paginate(filter, { limit = 20, sort = { createdAt: -1 } } = {}) {
    return this.model.find(filter).sort(sort).limit(limit);
  }
}

module.exports = BaseRepository;

