import test from "node:test";
import assert from "node:assert/strict";
import { categorize, addDays, todayInMalaysia } from "../lib/logic/categorize.ts";
test("completed overrides deadlines and overdue overrides in-progress", () => {
 assert.equal(categorize({status:"completed",due_date:"2026-09-01"}, "2026-10-02"),"Completed");
 assert.equal(categorize({status:"in_progress",due_date:"2026-10-01"}, "2026-10-02"),"Overdue");
});
test("today and exactly seven days are due this week; eight days are not", () => {
 for (const due_date of ["2026-10-02","2026-10-09"]) assert.equal(categorize({status:"pending",due_date},"2026-10-02"),"Due This Week");
 assert.equal(categorize({status:"in_progress",due_date:"2026-10-10"},"2026-10-02"),"In Progress");
 assert.equal(categorize({status:"pending",due_date:null},"2026-10-02"),"Upcoming");
});
test("date arithmetic crosses months and Malaysia midnight correctly", () => {
 assert.equal(addDays("2026-12-30",7),"2027-01-06");
 assert.equal(todayInMalaysia(new Date("2026-10-01T16:00:00Z")),"2026-10-02");
});
