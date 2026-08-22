const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Initialize database with new tables for profile and notification system
function initializeDatabase() {
    const db = new sqlite3.Database('./database.db');
    
    console.log('Initializing database with new profile and notification tables...');
    
    // Read the SQL schema file
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database-updates.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    db.serialize(() => {
        statements.forEach((statement, index) => {
            const trimmedStatement = statement.trim();
            if (trimmedStatement) {
                db.run(trimmedStatement, function(err) {
                    if (err) {
                        console.error(`Error executing statement ${index + 1}:`, err.message);
                        console.error('Statement:', trimmedStatement);
                    } else {
                        console.log(`✓ Executed statement ${index + 1}`);
                    }
                });
            }
        });
        
        // Add missing columns to existing users table if they don't exist
        db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding status column:', err.message);
            } else if (!err) {
                console.log('✓ Added status column to users table');
            }
        });
        
        db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding created_at column:', err.message);
            } else if (!err) {
                console.log('✓ Added created_at column to users table');
            }
        });
        
        db.run(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding updated_at column:', err.message);
            } else if (!err) {
                console.log('✓ Added updated_at column to users table');
            }
        });
        
        db.run(`ALTER TABLE users ADD COLUMN last_login DATETIME`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding last_login column:', err.message);
            } else if (!err) {
                console.log('✓ Added last_login column to users table');
            }
        });
        
        db.run(`ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding login_attempts column:', err.message);
            } else if (!err) {
                console.log('✓ Added login_attempts column to users table');
            }
        });
        
        db.run(`ALTER TABLE users ADD COLUMN locked_until DATETIME`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding locked_until column:', err.message);
            } else if (!err) {
                console.log('✓ Added locked_until column to users table');
            }
        });

        // Add missing columns to servers table for Node.js and Python bots
        db.run(`ALTER TABLE servers ADD COLUMN runtime_type TEXT DEFAULT 'minecraft'`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding runtime_type column:', err.message);
            } else if (!err) {
                console.log('✓ Added runtime_type column to servers table');
            }
        });

        db.run(`ALTER TABLE servers ADD COLUMN startup_command TEXT DEFAULT ''`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding startup_command column:', err.message);
            } else if (!err) {
                console.log('✓ Added startup_command column to servers table');
            }
        });

        db.run(`ALTER TABLE servers ADD COLUMN working_directory TEXT DEFAULT ''`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding working_directory column:', err.message);
            } else if (!err) {
                console.log('✓ Added working_directory column to servers table');
            }
        });

        db.run(`ALTER TABLE servers ADD COLUMN environment_variables TEXT DEFAULT '{}'`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding environment_variables column:', err.message);
            } else if (!err) {
                console.log('✓ Added environment_variables column to servers table');
            }
        });

        db.run(`ALTER TABLE servers ADD COLUMN description TEXT DEFAULT ''`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding description column:', err.message);
            } else if (!err) {
                console.log('✓ Added description column to servers table');
            }
        });
        
        // Create welcome notifications for existing users
        db.all('SELECT id, username FROM users', [], (err, users) => {
            if (err) {
                console.error('Error fetching users:', err.message);
                return;
            }
            
            users.forEach(user => {
                // Check if user already has notifications
                db.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [user.id], (err, result) => {
                    if (err) {
                        console.error('Error checking notifications:', err.message);
                        return;
                    }
                    
                    if (result.count === 0) {
                        // Create welcome notification
                        db.run(`
                            INSERT INTO notifications (user_id, title, message, type, category, icon, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                        `, [
                            user.id,
                            'Welcome to the Enhanced Panel!',
                            'Your panel has been upgraded with new profile and notification features. Check out your profile settings to customize your experience.',
                            'info',
                            'system',
                            'star'
                        ], (err) => {
                            if (err) {
                                console.error(`Error creating welcome notification for user ${user.username}:`, err.message);
                            } else {
                                console.log(`✓ Created welcome notification for user ${user.username}`);
                            }
                        });
                    }
                });
            });
        });
        
        console.log('Database initialization completed!');
    });
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };