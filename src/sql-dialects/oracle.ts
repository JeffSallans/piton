import * as oracledb from 'oracledb';
import { SqlDialectAdapter } from '../models/SqlDialectAdapter';
import { OutputChannelLogger } from '../logging-and-debugging/OutputChannelLogger';

//oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let connection: any;

const toExport: SqlDialectAdapter = {
    setupConnection: async function(fullConnectionString) {
        const passWordRegex = /^(.*?[^\"])\/(.*?[^\"])\@(.*?)$/g;
        const regexResult = passWordRegex.exec(fullConnectionString) || ['', undefined, undefined, undefined];
        const username = regexResult[1];
        const password = regexResult[2];
        const connectString = regexResult[3];

        OutputChannelLogger.log(`===== Connection Details =====
    fullConnectionString: ${fullConnectionString.replace(password || 'password', '****')}
    username: ${username}
    connectString: ${connectString}
`);

        connection = await oracledb.getConnection({
            username,
            password,
            connectString,
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