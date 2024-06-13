import { connect, ConnectionPool } from 'mssql';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';

let client: ConnectionPool | null = null;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(connectionString) {
        client = await connect(connectionString);
        return;
    },
    closeConnection: async function() {
        await client?.close();
    },
    countSQL: async function(query) {
        console.log(`CountSQL: ${query}`);
        if (client === null) { await console.log('FAILED'); return 0;}

        try {
            const res = await client.query(query);
            return res.recordset.length;
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
            return res.recordset;
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