const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // common local default
    port: 3306
});

console.log('Attempting to connect to Local MySQL...');
connection.connect((err) => {
    if (err) {
        console.error('Local Connection failed:', err.message);
        return;
    }
    console.log('SUCCESS! Connected to Local MySQL.');
    connection.query('SHOW DATABASES', (err, rows) => {
        if (err) console.error('Query error:', err);
        else {
            console.log('Found databases:', rows.map(r => r.Database));
        }
        connection.end();
    });
});
