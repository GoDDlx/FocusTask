import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(1); }

const pool = new pg.Pool({ connectionString: url });
const DAY = 86_400_000;
const today = new Date(); today.setHours(0, 0, 0, 0);
const pad = (n) => `${n}`.padStart(2, "0");
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const at = (offset, time) => {
  const d = new Date(today.getTime() + offset * DAY);
  const [h,m] = time.split(":").map(Number); d.setHours(h,m,0,0); return d;
};
const seeds = [
  ["Finish thesis chapter draft","Compile the literature review.","HIGH",at(0,"17:00"),"17:00",true,false,null],
  ["Pay electricity bill","Clear the outstanding invoice.","HIGH",at(-1,"10:00"),"10:00",true,false,null],
  ["Team stand-up notes","Collect blockers and post the summary.","MEDIUM",at(0,"09:30"),"09:30",true,false,null],
  ["Grocery run","Tomatoes, basil, olive oil, oat milk and coffee beans.","LOW",at(0,"19:15"),"19:15",true,false,null],
  ["Refactor repository layer","Extract database queries into a repository module.","MEDIUM",at(2,"11:00"),"11:00",true,false,null],
  ["Book dentist appointment","Prefer an early morning weekday slot.","LOW",at(6,"09:00"),null,false,false,null],
  ["Set up CI pipeline","Wire typecheck, lint and production build.","MEDIUM",null,null,false,false,null],
  ["Read two chapters of Deep Work","Evening reading session.","LOW",at(-2,"21:00"),"21:00",false,true,at(-2,"22:10")],
  ["Renew gym membership","Ask about the annual discount.","LOW",at(-3,"08:00"),"08:00",true,true,at(-3,"09:05")],
  ["Prepare sprint demo deck","Slides for the Thursday demo.","HIGH",at(1,"14:30"),"14:30",true,false,null],
];
try {
  const existing = await pool.query("SELECT count(*)::int AS count FROM tasks");
  if (existing.rows[0].count > 0) process.exit(0);
  for (const t of seeds) await pool.query(
    `INSERT INTO tasks (title,description,priority,due_date,due_time,due_timestamp,reminder_enabled,is_completed,completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [t[0],t[1],t[2],t[3]?dateStr(t[3]):null,t[4],t[3],t[5],t[6],t[7]]
  );
  console.log(`Seeded ${seeds.length} demo tasks.`);
} catch (error) { console.error("Seed failed:", error.message); process.exit(1); }
finally { await pool.end(); }