"use strict";

const request = require("supertest");
const Job = require('../models/job');
const db = require("../db");
const app = require("../app");

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


/************************************** POST /jobs */

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
			.set("authorization", `Bearer ${u1Token}`); //TODO: u1Token > adminToken
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
			.set("authorization", `Bearer ${u2Token}`); //TODO: u1Token > nonadminToken
		expect(resp.statusCode).toEqual(401);
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

	test("fails: invalid query data. Fails validator", async function () {
		const query = {
			salary: "badstring",
		};

		const resp = await request(app).get("/jobs").query(query);
		expect(resp.statusCode).toEqual(400);
	});

	test("ok for valid filter", async function () {
		const query = {
			title: "j2",
			minSalary: 10,
			hasEquity: true,
		};

		const resp = await request(app).get("/jobs").query(query);
		expect(resp.body).toEqual({
			jobs: [
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


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {

	test("works for anon", async function () {
		const j1Id = await Job.getJobId('j1')
		const resp = await request(app).get(`/jobs/${j1Id}`);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "j1",
				salary: 100000,
				equity: "0.34",
				companyHandle: "c1"
			},
		});
	});

	test("not found for no such jobs", async function () {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});



/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {

	test("works for admin", async function () {
		const j1Id = await Job.getJobId('j1')
		const resp = await request(app)
			.patch(`/jobs/${j1Id}`)
			.send({
				title: "update",
				salary: 150000,
				equity: 1
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "update",
				salary: 150000,
				equity: "1",
				companyHandle: "c1"
			},
		});
	});

	test("unauth for non-admin", async function () {
		const j1Id = await Job.getJobId('j1')
		const resp = await request(app)
			.patch(`/jobs/${j1Id}`)
			.send({
				title: "update",
				salary: 150000,
				equity: 1
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const j1Id = await Job.getJobId('j1')
		const resp = await request(app)
			.patch(`/jobs/${j1Id}`)
			.send({
				title: "update",
				salary: 150000,
				equity: 1
			});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such job", async function () {
		const resp = await request(app)
			.patch(`/companies/nope`)
			.send({
				name: "new nope",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on id change attempt", async function () {
		const j1Id = await Job.getJobId('j1')

		const resp = await request(app)
			.patch(`/jobs/${j1Id}`)
			.send({
				id: 1,
				title: "update",
				salary: 150000,
				equity: 1
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	//TODO: bad request on company handle change

	test("bad request on invalid data", async function () {
		const j1Id = await Job.getJobId('j1')

		const resp = await request(app)
			.patch(`/jobs/${j1Id}`)
			.send({
				salary: -20000,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {

	test("works for admin", async function () {
		const j1Id = await Job.getJobId('j1')

		const resp = await request(app)
			.delete(`/jobs/${j1Id}`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: `${j1Id}` });
	});

	test("unauth for non-admin", async function () {
		const j1Id = await getJobId('j1')

		const resp = await request(app)
			.delete(`/jobs/${j1Id}`)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const j1Id = await getJobId('j1')

		const resp = await request(app).delete(`/jobs/${j1Id}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found or no such job", async function () {
		const resp = await request(app)
			.delete(`/jobs/0`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
