
const startDateStr = "2026-02-13T07:00:00.000Z"; // From MyJobsView (local time converted to ISO)
// Wait, MyJobsView uses .split("T")[0] for inputs, but ISO string for request.
// In handleImportPeriod:
// const start = new Date(periodStart); // "2026-02-13"
// const end = new Date(start);
// end.setDate(start.getDate() + 13);
// body: startDate: start.toISOString(), endDate: end.toISOString()

// Let's simulate exact values sent.
const periodStart = "2026-02-13";
const s = new Date(periodStart); // UTC midnight if node, or local?
// In Node: new Date("2026-02-13") is UTC.
console.log("s (from string):", s.toISOString());

const e = new Date(s);
e.setDate(s.getDate() + 13);
console.log("e (calculated):", e.toISOString());

const reqBody = {
    startDate: s.toISOString(),
    endDate: e.toISOString()
};

// Server logic
const start = new Date(reqBody.startDate);
start.setUTCHours(0, 0, 0, 0);
console.log("Server Start:", start.toISOString());

const end = new Date(reqBody.endDate);
end.setUTCHours(23, 59, 59, 999);
console.log("Server End:", end.toISOString());

// Job Date
const jobDateStr = "2026-02-13";
const parsedJobDate = new Date(`${jobDateStr}T12:00:00`); // Local time?
// If Node is UTC, this is T12:00:00Z
console.log("Job Date:", parsedJobDate.toISOString());

// Check
const match = parsedJobDate >= start && parsedJobDate <= end;
console.log("Match:", match);
