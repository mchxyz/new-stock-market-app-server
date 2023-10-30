const { Schema, model } = require("mongoose");

const companySchema = new Schema({
  name: String,
  description: String,
  logoUrl: String,
  ticker: String,
});

module.exports = model("company", companySchema);
