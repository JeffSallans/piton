import * as sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';

let client: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(connectionString) {
        client = await open({
            driver: '',
            filename: connectionString
        });
        return;
    },
    closeConnection: async function() {
        await client?.close();
    },
    countSQL: async function(query) {
        console.log(`CountSQL: ${query}`);
        if (client === null) { await console.log('FAILED'); return 0;}

        try {
            const res = await client.get(query);
            return res.rowCount;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    querySQL: async function(query) {
        console.log(`QuerySQL: ${query}`);
        if (client === null) { await console.log('FAILED'); return [];}

        try {
            const res = await client.get(query);
            return res.rows;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    executeSQL: async function(query) {
        console.log(`ExecuteSQL: ${query}`);
        if (client === null) { await console.log('FAILED'); return;}

        const res = await client.run(query);
        return;
    },
};

export default toExport;