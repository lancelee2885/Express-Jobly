"use strict";

const e = require("cors");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Create a job (from data), update db, and returns new jobs data.
   * @param {Object} --- {title, salary, equity, companyHandle}
   * @returns {Object} --- { id, title, salary, equity, companyHandle }
   * 
   * */

  static async create({ title, salary, equity, companyHandle }) {

    if (!title || !companyHandle){
      throw new BadRequestError("title or companyHandle is missing")
    }

    const result = await db.query(
      `
      INSERT INTO jobs(
        title,
        salary,
        equity,
        company_handle)
        VALUES 
          ($1, $2, $3, $4)
        RETURNING 
          id,
          title,
          salary,
          equity,
          company_handle as "companyHandle"
      `,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];

    return job;
  }
  
  /**findAll
   * DESCRIPTION: returns all job postings by querying the db
   * @returns {object} list of job postings with id, title, salary, equity, and 
   *                   company handle.
   *                   [{ id, title,...}...]
   */

  static async findAll() {
    const results = await db.query(
      ` SELECT id, 
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
      `
    );
    const jobs = results.rows;
    return jobs;
  }

  /**get
   * DESCRIPTION: Given a job id, the method returns an object with the
   *              job data from the database. If job id is not in th database
   *              the method will throw an error.
   * @param {Number} id  --- job id
   * @returns {Object} --- job data
   *                       {id, title, salary...}
   */
  static async get(id) {
    const result = await db.query(`
      SELECT id, 
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs 
      WHERE id=$1
      `,
      [id]
    );
    const job = result.rows[0];
    if(!job) throw new NotFoundError('Cannot find job');

    return job;
  }

   /**update
   * DESCRIPTION: Given a job id and the data user wants to update, 
   *              the method returns an object with the job data.
   *              The user CANNOT change the job id nor the company handle,
   *              attempts will throw an error. If job id is not in th database
   *              the method will throw an error. 
   * 
   * @param {Number} id  --- job id
   * @param {Object} data --- data user wants to update
   *                          {titl, salary, equity}
   * @returns {Object} --- job data
   *                       {id, title, salary...}
   */
  static async update(id, data) {
    
    if ("id" in data || "companyHandle" in data) throw new BadRequestError('Cannot change job id!');

    const {setCols, values} = sqlForPartialUpdate(data,{});
    const handleVarIdx = "$" + (values.length + 1); 

    const result = await db.query(`
        UPDATE jobs 
        SET ${setCols}
        WHERE id=${handleVarIdx}
        RETURNING
          id , title, salary, equity, company_handle AS "companyHandle" 
      `,
       [...values, id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job id: ${id}`);
    return job;
  }
   /**remove
   * DESCRIPTION: Deletes the job given the job id.  If job id is not
   *              in th database the method will throw an error. 
   * 
   * @param {Number} id  --- job id
   * @param {Object} data --- data user wants to update
   *                          {titl, salary, equity}
   */
  
  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No id: ${id}`);
    
  }
}

module.exports = Job;
