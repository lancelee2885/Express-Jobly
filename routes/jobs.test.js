
"use strict";

const request = require("supertest");
const Job = require('../models/job');
const db = require("../db");
const app = require("../app");
// const axios = require("axios");
// const AxiosMockAdapter = require("axios-mock-adapter");
// const axiosMock = new AxiosMockAdapter(axios); 

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
	const newJob1 = {
		title: "newJob1",
		salary: 100000,
		equity: 0.6,
		companyHandle: "c1"
	};

	const newJob2 = {
		title: "newJob2",
		salary: 100000,
		equity: 0,
		companyHandle: "c2"
	};

	// variable with missing data
	const newJob3 = {
		title: "newJob2",
		salary: 100000,
		companyHandle: "c2"
	};

	test("ok for admin job creation", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob1)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);

		expect({ ...resp.body.job }).toEqual({
			id: expect.any(Number),
			title: newJob1.title,
			equity: `${newJob1.equity}`,
			salary: newJob1.salary,
			companyHandle: newJob1.companyHandle,
		});
	});

	test("Unauthorized creation with non-admin status", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob1)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("bad creation with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob3)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});


	test("bad creation with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob3)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "j1",
					salary: 100000,
					equity: "0.34",
					companyHandle: "c1"
				},
				{
					id: expect.any(Number),
					title: "j2",
					salary: 100000,
					equity: "0.34",
					companyHandle: "c2"
				},
			],
		});
	});

	test("fails: test next() fitler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE jobs CASCADE");
		const resp = await request(app)
			.get("/jobs")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	// TODO: add schema for test to pass
	test("fails: invalid query data. Fails validator", async function () {
		const query = {
			salary: "badstring",
		};

		const resp = await request(app).get("/jobs").query(query);
		expect(resp.statusCode).toEqual(400);
	});
	// TODO: add schema
	test("ok for valid filter", async function () {
		const query = {
			title: "j2",
			minSalary: 10,
			hasEquity: true,
		};

		const resp = await request(app).get("/jobs").query(query);
		expect(resp.body).toEqual({
			companies: [
				{
					id: expect.any(Number),
					title: "j2",
					salary: 100000,
					equity: "0.34",
					companyHandle: "c2"
				}
			],
		});

	});
});


/************************************** GET /companies/:handle */

// describe("GET /companies/:handle", function () {
//   test("works for anon", async function () {
//     const resp = await request(app).get(`/companies/c1`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("works for anon: company w/o jobs", async function () {
//     const resp = await request(app).get(`/companies/c2`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     });
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app).get(`/companies/nope`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });

// /************************************** PATCH /companies/:handle */

// describe("PATCH /companies/:handle", function () {
//   test("works for admin", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         name: "C1-new",
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1-new",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("unauth for non-admin", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         name: "C1-new",
//       })
//       .set("authorization", `Bearer ${u2Token}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app).patch(`/companies/c1`).send({
//       name: "C1-new",
//     });
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found on no such company", async function () {
//     const resp = await request(app)
//       .patch(`/companies/nope`)
//       .send({
//         name: "new nope",
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request on handle change attempt", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         handle: "c1-new",
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(400);
//   });

//   test("bad request on invalid data", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         logoUrl: "not-a-url",
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

// /************************************** DELETE /companies/:handle */

// describe("DELETE /companies/:handle", function () {
//   test("works for admin", async function () {
//     const resp = await request(app)
//       .delete(`/companies/c1`)
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.body).toEqual({ deleted: "c1" });
//   });

//   test("unauth for non-admin", async function () {
//     const resp = await request(app)
//       .delete(`/companies/c1`)
//       .set("authorization", `Bearer ${u2Token}`);
//       expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app).delete(`/companies/c1`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app)
//       .delete(`/companies/nope`)
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });
