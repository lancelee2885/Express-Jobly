"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterAll,
  commonAfterEach
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: 0,
    companyHandle: "c1"
  }

  test("works", async function () {
    let job = await Job.create(newJob)
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 100000,
      equity: "0",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
          FROM jobs
          WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "new",
        salary: 100000,
        equity: "0",
        company_handle: "c1"
      },
    ]);
  });

  test("bad request with no data", async function () {
    try {
      await Job.create({});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/******************************** findAll */

describe("findAll", function () {

  test("works: not passing in filters as argument", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 120000,
        equity: "0",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 130000,
        equity: "1",
        companyHandle: "c3"
      },
    ]);
  });

  test("works: no filter", async function () {
    let filter = {}
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 120000,
        equity: "0",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 130000,
        equity: "1",
        companyHandle: "c3"
      },
    ])
  });

  test("works: 1 filter", async function () {
    let filter = {
      title: "j1",
    }
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      }
    ])
  });

  //filter by minSalary 100000 and have equity 
  //{minSalary >= 100000, hasEquity: true}
  test("works: 2 filter", async function () {
    let filter = {
      minSalary: 100000,
      hasEquity: true,
    }
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 130000,
        equity: "1",
        companyHandle: "c3"
      }
    ])
  });

  //filter by minSalary 100000 and have equity and title j3 
  //{title: "j1", hasEquity: false, minSalary: 90000}
  test("works: 3 filter", async function () {
    let filter = {
      minSalary: 100000,
      hasEquity: false,
      title: "j1",
    }
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 110000,
        equity: "0",
        companyHandle: "c1"
      }
    ])
  });
});

/******************************** get(id) */

describe("get(id)", function () {
  test("works: get id", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 110000,
      equity: "0",
      companyHandle: "c1"
    });
  });

  test("notfound: id does not exist", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/******************************** update(id, data) */

describe("update jobs", function () {
  const updateJobData = {
    title: "Update",
    salary: 200000,
    equity: "1"
  }

  const badUpdateJobData = {
    id: 2,
    title: "Update",
    salary: 200000,
    equity: "1",
    companyHandle: "test"
  }

  test("works: update job", async function () {
    let updatedJob = await Job.update(1, updateJobData);
    expect(updatedJob).toEqual({
      id: 1,
      title: "Update",
      salary: 200000,
      equity: "1",
      companyHandle: "c1"
    });
  });

  test("invalid: trying to update job id and company_handgle", async function () {
    try {
      await Job.update(1, badUpdateJobData);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("invalid: invalid job id", async function () {
    try {
      await Job.update(0, updateJobData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/******************************** remove(id) */

describe("remove a job", function () {

  test("works", async function(){
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=1"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("invalid job id", async function(){
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
