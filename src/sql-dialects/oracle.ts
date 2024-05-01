import * as oracledb from 'oracledb';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';

//oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let connection: any;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(connectionString) {
        connection = await oracledb.getConnection({
            connectString: connectionString,
        });
        return connection;
    },
    closeConnection: async function() {
        await connection?.close();
    },
    countSQL: async function(query) {
        console.log(`CountSQL: ${query}`);
        if (connection === null) { await console.log('FAILED'); return 0;}

        try {
            const res = await connection.execute(query);
            return res.rows.length;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    querySQL: async function(query) {
        console.log(`QuerySQL: ${query}`);
        if (connection === null) { await console.log('FAILED'); return [];}

        try {
            const res = await connection.execute(query);
            return res.rows;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    },
    executeSQL: async function(query) {
        console.log(`ExecuteSQL: ${query}`);
        if (connection === null) { await console.log('FAILED'); return;}

        const res = await connection.execute(query);
        return;
    },
};

export default toExport;