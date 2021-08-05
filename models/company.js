"use strict";

const e = require("cors");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *  
   * When given an object of filters:
   *    returns filtered list of companies with details
   *    [{ handle, name, description, numEmployees, logoUrl }, ...]
   *  
   * When not given any parameter:
   *    return list of all companies in database
   *    [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * @param {obj} filters --- optional: { minEmployees: 2, maxEmployees: 3, nameLike: "2" }
   * 
   * */

  // TODO: lines 64, should pass nothing into findAll. Update docstring for findAll
  // and _filterByClause

  static async findAll(filters) {
    let filterClause, sqlQuery;
    if ( filters &&
      (filters.minEmployees ||
      filters.maxEmployees ||
      filters.nameLike)
    ) {
      filterClause = this._filterByClause(filters);
    }

    let selectSQL = `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
                    FROM companies`;
    let orderBySQL = `ORDER BY name`;
    let whereSQL = `WHERE`;

    if (filterClause === undefined) {
      sqlQuery = selectSQL + " " + orderBySQL;

    } else {
      sqlQuery = selectSQL 
        + " " 
        + whereSQL
        + " "
        + filterClause.colIdx
        + " "
        + orderBySQL;
    }

    let values = filterClause === undefined ? null : filterClause.values;

    const companiesRes = await db.query(sqlQuery, values);

    return companiesRes.rows;
  }

  /**
 *  Given an obj of filters (minEmployees, maxEmployees, or nameLike)
 *  Return a string of sql WHERE clause that can be used in findAll()
 * 
 * @returns {object}  {$1:filterValue}
 */

  // NOTE: use _ to signify it is an internal use only  
  static _filterByClause({ minEmployees, maxEmployees, nameLike }) {

    let colIdx = [];
    let values = [];

    if (maxEmployees < minEmployees) {
      throw new BadRequestError("maxEmployees has to be greater than minEmployees");
    }
    
    let idx = 1
    if (minEmployees) {
      colIdx.push(`num_employees >= $${idx}`);
      values.push(minEmployees);
      idx++;
    }
    if (maxEmployees) {
      colIdx.push(`num_employees <= $${idx}`);
      values.push(maxEmployees);
      idx++;
    }
    if (nameLike) {
      colIdx.push(`name ILIKE $${idx}`);
      values.push(`%${nameLike}%`);
      idx++;
    }

    colIdx = colIdx.join(' AND ');

    return { colIdx, values };

  }


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }


}

module.exports = Company;
