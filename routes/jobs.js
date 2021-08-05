"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Job = require("../models/job");
//TODO: Add schema for job 
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = express.Router();


/**POST / => { job: {id, title, salary, equity, companyHandle} }
 * DESCRIPTION: creates a new job given data from the request body. 
 * 				
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
const validator = jsonschema.validate(req.body, jobNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201)
  			.json({job});
});


/**GET / => {[job:{id...}...}]}
 * DESCRIPTION: gets a list of all jobs from the database.
 */
router.get("/", async function (req, res, next) {
  const jobs = await Job.findAll();
  return res.json({ jobs });
});


/** GET /[id] => { job }
 * DESCRIPTION: Gets the job data from the database given an id
 * 
 * Returns { id, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});


/** PATCH /id { id} => { job }
 *	
 * DESCRIPTION: updates job data in database and returns the updated data.
 * Data can include: {title, salary, equity}
 *  
 * Returns {id, title, salary, equity, companyHandle}	
 * 		   or a bad request if id or request data is invalid
 *
 * Authorization required: login and admin 
 **/

router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
const validator = jsonschema.validate(req.body,jobUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});


/** DELETE /[id]  =>  { deleted: id}
 * DESCRIPTION: deletes job from database and returns deleted id.
 *
 * Authorization required: login and admin
 **/

router.delete("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id});
});


module.exports = router;
