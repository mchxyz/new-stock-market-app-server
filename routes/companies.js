const router = require("express").Router();

const companiesController = require("../controllers/companies");

router.get("/", companiesController.getCompanies);

router.post("/", companiesController.addCompany);

router.put("/:id", companiesController.updateCompany);

router.delete("/:id", companiesController.removeCompany);

module.exports = router;
