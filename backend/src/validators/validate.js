const AppError = require("../utils/app-error");

function validate(schema, target = "body") {
  return function validateRequest(req, res, next) {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return next(
        new AppError("Validation failed", 422, error.details.map((item) => item.message))
      );
    }

    req[target] = value;
    return next();
  };
}

module.exports = validate;

