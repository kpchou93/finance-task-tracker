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

import { filterTasks, sortTasks } from "../lib/logic/filters.ts";
test("combined filters intersect and search covers remarks and responsible staff", () => {
 const tasks = [
  {id:"1",company_id:"acme",category:"Payment",priority:"high",status:"pending",description:"Vendor run",remarks:"CFO approval",person_in_charge:"Sarah",due_date:"2026-10-03",amount:80000,created_at:"2026-10-01"},
  {id:"2",company_id:"globex",category:"Audit",priority:"high",status:"pending",description:"Audit papers",remarks:null,person_in_charge:"Sarah",due_date:null,amount:0,created_at:"2026-10-02"},
  {id:"3",company_id:"acme",category:"Payment",priority:"low",status:"completed",description:"Invoices",remarks:null,person_in_charge:"Mike",due_date:"2026-10-04",amount:100,created_at:"2026-10-02"}
 ];
 assert.deepEqual(filterTasks(tasks,{company:"acme",priority:"high"},"2026-10-02").map(t=>t.id),["1"]);
 assert.deepEqual(filterTasks(tasks,{search:"cfo"},"2026-10-02").map(t=>t.id),["1"]);
 assert.deepEqual(filterTasks(tasks,{search:" SARAH "},"2026-10-02").map(t=>t.id),["1","2"]);
 assert.equal(filterTasks(tasks,{},"2026-10-02").length,3);
 assert.deepEqual(sortTasks(tasks,"due").map(t=>t.id),["1","3","2"]);
 assert.deepEqual(sortTasks(tasks,"amount").map(t=>t.id),["1","3","2"]);
 assert.equal(tasks[0].id,"1");
});

import { suggestPriority } from "../lib/ai/priority.ts";
test("priority scoring and confidence meet the sprint success scenario", () => {
 const proposal = suggestPriority({due_date:"2026-10-04",amount:80000,category:"Payment"},"2026-10-02");
 assert.equal(proposal.priority,"high");
 assert.equal(proposal.confidence,0.82);
 assert.equal(proposal.score,0.6);
 assert.equal(suggestPriority({due_date:"2026-10-01",amount:0,category:"Reporting"},"2026-10-02").priority,"medium");
 assert.equal(suggestPriority({due_date:null,amount:50000,category:"Reporting"},"2026-10-02").priority,"low");
 assert.equal(suggestPriority({due_date:"2026-10-01",amount:80000,category:"Audit",status:"completed"},"2026-10-02").score,0);
});
