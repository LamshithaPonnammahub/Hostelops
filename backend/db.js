const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hostelops.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

module.exports = {
    query: (text, params) => {
        return new Promise((resolve, reject) => {
            const isSelect = text.trim().toUpperCase().startsWith('SELECT');
            const isInsertOrUpdate = text.trim().toUpperCase().startsWith('INSERT') || text.trim().toUpperCase().startsWith('UPDATE');

            // Convert Postgres placeholders ($1, $2) to SQLite placeholders (?, ?)
            let sqliteText = text;
            if (params && params.length > 0) {
                params.forEach((param, index) => {
                    const regex = new RegExp(`\\$${index + 1}\\b`, 'g');
                    sqliteText = sqliteText.replace(regex, '?');
                });
            }

            // Remove RETURNING * mapping for SQLite since it's tricky, we will map it manually in index.js
            if (isInsertOrUpdate) {
                const returningTextMatch = sqliteText.match(/RETURNING \*/i);
                if (returningTextMatch) {
                    sqliteText = sqliteText.replace(/RETURNING \*/i, '');
                }
            }

            if (isSelect) {
                db.all(sqliteText, params || [], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ rows });
                    }
                });
            } else {
                db.run(sqliteText, params || [], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        // Mock a Postgres RETURNING * response
                        let returningRow = { id: this.lastID };
                        const upperText = sqliteText.toUpperCase();
                        if (upperText.includes('UPDATE COMPLAINTS')) {
                            returningRow.status = params[0];
                            returningRow.id = params[1];
                        } else if (upperText.includes('INSERT INTO USERS')) {
                            returningRow.name = params[0];
                            returningRow.email = params[1];
                            returningRow.password = params[2];
                            returningRow.role = params[3];
                        } else if (upperText.includes('INSERT INTO COMPLAINTS')) {
                            returningRow.category = params[0];
                            returningRow.description = params[1];
                            returningRow.priority = params[2];
                            returningRow.student_id = params[3];
                        } else {
                            returningRow = { ...returningRow, ...params };
                        }

                        resolve({
                            rows: [returningRow],
                            rowCount: this.changes
                        });
                    }
                });
            }
        });
    }
};
