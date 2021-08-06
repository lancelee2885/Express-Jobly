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

    if (!title || !companyHandle) {
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

  /** Find all jobs with or without filter.
   *
   * When given an object of filters:
   *    returns filtered list of companies with details
   *    [{ id, title, salary, equity, companyHandle }, ...]
   *
   * When not given any parameter:
   *    return list of all companies in database
   *    [{ id, title, salary, equity, companyHandle }, ...]
   *
   * @param {obj} filters --- optional: { title: 'c1', minSalary: 50000, hasEquity: true }
   *
   * */

  static async findAll(filters) {

    let filterClause, sqlQuery;
    if (
      filters &&
      (filters.title || filters.minSalary || filters.hasEquity)
    ) {
      filterClause = this._filterByClause(filters);
    }

    let selectSQL = `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                    FROM jobs`;
    let whereSQL = `WHERE`;

    if (filterClause === undefined) {
      sqlQuery = selectSQL;
    } else {
      sqlQuery =
        selectSQL +
        " " +
        whereSQL +
        " " +
        filterClause.colIdx;
    }

    let values = filterClause === undefined ? null : filterClause.values;

    const jobsRes = await db.query(sqlQuery, values);

    return jobsRes.rows;
  }

  /**
   *  Given an obj of filters (title, minSalary, or hasEquity)
   *  Return { colIdx, values } where colIdx is for WHERE clause of findAll()
   *  and values are actual value for filtering
   *
   * @returns {object}  {$1:filterValue}
   */

  // NOTE: use _ to signify it is an internal use only
  static _filterByClause({ title, minSalary, hasEquity }) {
    let colIdx = [];
    let values = [];

    let idx = 1;
    if (title) {
      colIdx.push(`title ILIKE $${idx}`);
      values.push(`%${title}%`);
      idx++;
    }
    if (minSalary) {
      colIdx.push(`salary >= $${idx}`);
      values.push(minSalary);
      idx++;
    }
    if (hasEquity) {
      colIdx.push(`equity > $${idx}`);
      values.push(0);
      idx++;
    }
    if (hasEquity === false) {
      colIdx.push(`equity = $${idx}`);
      values.push(0);
      idx++;
    }

    colIdx = colIdx.join(" AND ");

    return { colIdx, values };
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
    if (!job) throw new NotFoundError('Cannot find job');

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

    const { setCols, values } = sqlForPartialUpdate(data, {});
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
  
  /**
   * DESCRIPTION: Given a job title, return job id
   * 
   * @param {String} job 
   * @returns number of id corresponding to job passing in
   */

  static async getJobId(job) {
    const result = await db.query(`SELECT id FROM jobs WHERE title = '${job}'`);
    return result.rows[0].id
  }
}

module.exports = Job;
