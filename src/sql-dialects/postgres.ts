import pg, { Client } from 'pg';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';

let client: Client | null = null;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(connectionString) {
        client = new Client({
            connectionString,
        });
        return await client.connect();
    },
    closeConnection: async function() {
        await client?.end();
    },
    countSQL: async function(query) {
        console.log(`CountSQL: ${query}`);
        if (client === null) { await console.log('FAILED'); return 0;}

        try {
            const res = await client.query(query);
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
            const res = await client.query(query);
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

        const res = await client.query(query);
        return;
    },
};

export default toExport;