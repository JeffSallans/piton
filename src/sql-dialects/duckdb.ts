import * as duckdb from 'duckdb';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';

let db: duckdb.Database;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(connectionString) {
        db = new duckdb.Database(':memory:');
        db.connect();
        return;
    },
    closeConnection: async function() {
        db.close();
    },
    countSQL: async function(query) {
        console.log(`CountSQL: ${query}`);
        if (db === null) { await console.error('FAILED'); return 0;}

        try {
            const res = await new Promise<duckdb.TableData>((resolve, reject) =>  {
                db.all(query, (err, rows) => {
                    if (err) { reject(err); }
                    resolve(rows);
                });
            });
            return res?.length;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    querySQL: async function(query) {
        console.log(`QuerySQL: ${query}`);
        if (db === null) { await console.error('FAILED'); return [];}

        try {
            const res = await new Promise<duckdb.TableData>((resolve, reject) =>  {
                db.all(query, (err, rows) => {
                    if (err) { reject(err); }
                    resolve(rows);
                });
            });
            return res;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    executeSQL: async function(query) {
        console.log(`ExecuteSQL: ${query}`);
        if (db === null) { await console.error('FAILED'); return;}

        const res = await db.exec(query);
        return;
    },
};

export default toExport;