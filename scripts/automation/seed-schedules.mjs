/**
 * Seed initial automation schedule records in NeonDB.
 * Run once after migration.
 */

import { getDb } from './lib/db.mjs';

async function seed() {
  const sql = getDb();
  console.log('Seeding automation schedules...\n');

  const schedules = [
    {
      id: 'weekly_pipeline',
      schedule_type: 'weekly_pipeline',
      cron_expression: '0 4 * * 1',  // Monday 4 AM IST
      config: {
        description: 'Full research-to-publish pipeline',
        timezone: 'Asia/Kolkata',
        day: 'Monday',
        time: '04:00 IST',
      },
    },
    {
      id: 'daily_posts',
      schedule_type: 'daily_posts',
      cron_expression: '0 11,15 * * *',  // 11 AM & 3 PM IST (= 9:30 & 1:30 UAE)
      config: {
        description: '2 LinkedIn posts per day from published report',
        timezone: 'Asia/Kolkata',
        morningSlot: '11:00 IST (9:30 AM UAE)',
        afternoonSlot: '15:00 IST (1:30 PM UAE)',
        postsPerDay: 2,
      },
    },
    {
      id: 'friday_review',
      schedule_type: 'friday_review',
      cron_expression: '0 18 * * 5',  // Friday 6 PM IST
      config: {
        description: 'Collect performance metrics, score report, learn patterns',
        timezone: 'Asia/Kolkata',
        day: 'Friday',
        time: '18:00 IST',
      },
    },
    {
      id: 'health_check',
      schedule_type: 'health_check',
      cron_expression: '0 */6 * * *',  // Every 6 hours
      config: {
        description: 'Check NeonDB, Postiz, Claude CLI, queue depth',
        interval: 'every 6 hours',
      },
    },
  ];

  for (const s of schedules) {
    const existing = await sql`SELECT id FROM automation_schedules WHERE id = ${s.id}`;
    if (existing.length > 0) {
      console.log(`  [SKIP] ${s.id} — already exists`);
      continue;
    }

    await sql`
      INSERT INTO automation_schedules (id, schedule_type, cron_expression, config)
      VALUES (${s.id}, ${s.schedule_type}, ${s.cron_expression}, ${JSON.stringify(s.config)})
    `;
    console.log(`  [OK] ${s.id}`);
  }

  console.log('\nSchedule seeding complete.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
