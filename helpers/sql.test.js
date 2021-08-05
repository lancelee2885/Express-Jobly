const { sqlForPartialUpdate } = require("./sql")

describe("sqlForPartialUpdate", function () {
  test("valid update", function () {
    const data = { firstName: 'Aliya', age: 32 };
    const sqlCols = {
      firstName: "first_name"
    };

    const result = sqlForPartialUpdate(data, sqlCols);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32]
    });
  });
  test("invalid update", function () {
    const data = {};
    const sqlCols = {};

    try {
      const result = sqlForPartialUpdate(data, sqlCols);
    } catch (e) {
      expect(e.message).toEqual("No data");
    }
  });
});