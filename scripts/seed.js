// Run: node scripts/seed.js
// This generates the correct bcrypt hash and prints the SQL to run

const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log('\n✅ Correct bcrypt hash for "admin123":');
  console.log(hash);
  console.log('\n📋 Run this SQL in Supabase (replaces any wrong hashes):');
  console.log(`
UPDATE users SET password_hash = '${hash}' WHERE email IN (
  'admin@campus.edu',
  'cafeteria@campus.edu',
  'store@campus.edu',
  'rahul@campus.edu',
  'priya@campus.edu'
);
  `);
}

main();
