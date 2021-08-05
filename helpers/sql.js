const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Given an object of data
 *  {firstName: 'Aliya', age: 32},
 *  Return an object with keys of psql SET clause
 *  and an array of values (['"first_name"=$1', '"age"=$2'])
 * 
 * @param {object}dataToUpdate: an obj containing keys columns to update and
 * values of what's going to be updated
 * {firstName: 'Aliya', age: 32}
 * 
 * @param {object}jsToSql converting camelCase javascript variable to snakeCase for psql query
 * numEmployees > num_employees
 * logoUrl > logo_url
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "), // SET clause of updating database
    values: Object.values(dataToUpdate), // parametized array
  };
}

module.exports = { sqlForPartialUpdate };
