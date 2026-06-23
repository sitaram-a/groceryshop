/**
 * Run this once to create/fix the admin account:
 *   node fix-admin.js
 */
require('dotenv').config();
const db     = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  const password = 'Admin@123';
  const hash     = await bcrypt.hash(password, 10);

  // Check if admin already exists
  const [rows] = await db.query("SELECT id FROM tbl_users WHERE email = 'admin@groceryshop.com'");

  if (rows.length) {
    // Update existing
    await db.query(
      "UPDATE tbl_users SET password = ?, role = 'admin', is_active = 1 WHERE email = 'admin@groceryshop.com'",
      [hash]
    );
    console.log('✅ Admin password updated successfully!');
  } else {
    // Insert new
    await db.query(
      "INSERT INTO tbl_users (name, email, password, role, is_active) VALUES ('Admin', 'admin@groceryshop.com', ?, 'admin', 1)",
      [hash]
    );
    console.log('✅ Admin account created successfully!');
  }

  console.log('\n  Email   : admin@groceryshop.com');
  console.log('  Password: Admin@123\n');
  process.exit(0);
}

fixAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
