const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdminUsers() {
  try {
    console.log('Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('Database connected successfully!');
    
    // Create admin user
    const adminPassword = 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO UPDATE SET 
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role
       RETURNING id, username, email, first_name, last_name, role`,
      ['admin', 'admin@financetracker.com', adminPasswordHash, 'Admin', 'User', 'admin']
    );
    
    console.log('✅ Admin user created/updated:', {
      username: adminUser.rows[0].username,
      email: adminUser.rows[0].email,
      role: adminUser.rows[0].role,
      password: adminPassword
    });
    
    // Create read-only user
    const readOnlyPassword = 'readonly123';
    const readOnlyPasswordHash = await bcrypt.hash(readOnlyPassword, 12);
    
    const readOnlyUser = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO UPDATE SET 
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role
       RETURNING id, username, email, first_name, last_name, role`,
      ['readonly', 'readonly@financetracker.com', readOnlyPasswordHash, 'Read', 'Only', 'read-only']
    );
    
    console.log('✅ Read-only user created/updated:', {
      username: readOnlyUser.rows[0].username,
      email: readOnlyUser.rows[0].email,
      role: readOnlyUser.rows[0].role,
      password: readOnlyPassword
    });
    
    // List all users
    const allUsers = await client.query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at'
    );
    
    console.log('\n📋 All users in database:');
    allUsers.rows.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
    });
    
    client.release();
    console.log('\n✅ Admin users setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUsers();
