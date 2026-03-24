const { Schema } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

function createBaseSchema(definition, options = {}) {
  return new Schema(
    {
      id: {
        type: String,
        default: uuidv4,
        index: true
      },
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      deletedAt: {
        type: Date,
        default: null
      },
      ...definition
    },
    {
      timestamps: true,
      minimize: false,
      ...options
    }
  );
}

module.exports = createBaseSchema;

