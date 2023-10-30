const Company = require("../models/company");

const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().lean();
    res.json({ companies });
  } catch (err) {
    next(err);
  }
};

const addCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.json({ company });
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ company });
  } catch (err) {
    next(err);
  }
};

const removeCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    res.json({ company });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCompanies,
  addCompany,
  updateCompany,
  removeCompany,
};
