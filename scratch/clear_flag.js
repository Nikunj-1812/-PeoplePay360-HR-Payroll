const { sql } = require('../backend/src/db');

async function clearFlags() {
  await sql`UPDATE users SET must_change_password = FALSE`;
  console.log('Successfully set must_change_password = FALSE for all users in DB.');
  process.exit(0);
}

clearFlags().catch(err => {
  console.error(err);
  process.exit(1);
});
