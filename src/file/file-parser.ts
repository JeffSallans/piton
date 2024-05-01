import { Range, TextDocument, SecretStorage } from "vscode";
import { map, first, range, includes } from 'lodash';
import { PitonFile } from "../models/PitonFile";
import { PitonFilePart } from "../models/PitonFilePart";
import { OutputChannelLogger } from "../logging-and-debugging/OutputChannelLogger";
import { PitonLanguageClient } from "../language/PitonLanguageClient";
import { ExtensionSecretStorage } from "../logging-and-debugging/ExtensionSecretStorage";

export async function getFileFromDoc(file: TextDocument, promptPassword: (user: string) => Promise<string>): Promise<PitonFile> {
    const text = file.getText();
    const fileNameRegex = /^(.+?)(\/|\\)([^\\\/]+?\.piton\.sql)/gi;
    const results = fileNameRegex.exec(file.fileName) || [];
    return await getFile(`${results[1]}${results[2]}`, results[3], text, promptPassword);
}

/** Returns */
export async function getFile(filePath: string, fileName: string, text: string, promptPassword: (user: string) => Promise<string>): Promise<PitonFile> {
    // Clear diagnostics for the file
    const filePathAndName = `${filePath}${fileName}`;
    PitonLanguageClient.clearDiagnosticErrors(filePathAndName);

    // File level params
    const connectionStringRegex = /\s*?\-\-\s+?pn\-connectionString\s(.*?)\s*?\r?\n/gi;
    const connectionString = (connectionStringRegex.exec(text) || [])[1];
    const connectionUserRegex = /\s*?\-\-\s+?pn\-connectionUser\s(.*?)\s*?\r?\n/gi;
    const connectionUser = (connectionUserRegex.exec(text) || [])[1];

    const runScheduleCronRegex = /\s*?\-\-\s+?pn\-runScheduleCron\s(.*?)\s*?\r?\n/gi;
    const runScheduleCron = (runScheduleCronRegex.exec(text) || [])[1];
    const sqlDialectRegex = /\s*?\-\-\s+?pn\-sqlDialect\s(.*?)\s*?\r?\n/gi;
    const sqlDialect = (sqlDialectRegex.exec(text) || [])[1];
    const skipRegex = /\s*?\-\-\s+?(pn\-skip)\s(.*?)\s*?\r?\n/gi;
    const skip = (skipRegex.exec(text) || [])[1];
    
    if (!sqlDialect) {
        PitonLanguageClient.addDiagnosticErrors(filePathAndName, new Range(0, 0, 0, 100), 'missing pn-sqlDialect');
        OutputChannelLogger.error(`====== SYNTAX ERROR ======\nmissing pn-sqlDialect \n${text}`, true);
    }
    const validDialects = ['postgres', 'duckdb'];
    if (!validDialects.includes(sqlDialect)) {
        PitonLanguageClient.addDiagnosticErrors(filePathAndName, new Range(0, 0, 0, 100), `invalid pn-sqlDialect given ${sqlDialect} expecting one of ${validDialects.concat(', ')}`);
        OutputChannelLogger.error(`====== SYNTAX ERROR ======\n invalid pn-sqlDialect given ${sqlDialect} expecting one of ${validDialects.concat(', ')} \n${text}`, true);
    }
    if (sqlDialect !== 'duckdb' && !connectionString) { 
        PitonLanguageClient.addDiagnosticErrors(filePathAndName, new Range(0, 0, 0, 100), 'missing pn-connectionString');
        OutputChannelLogger.error(`====== SYNTAX ERROR ======\nmissing pn-connectionString \n${text}`, true);
    }

    // Prompt for Connection Password, if it does not exists
    const connectionPassword = await ExtensionSecretStorage.secretStorage.get(`${connectionString}`);
    if (!connectionPassword && !!connectionString && connectionString.indexOf('pn-password') > 0) {
        const givenConnectionPassword = await promptPassword(connectionString);
        await ExtensionSecretStorage.secretStorage.store(`${connectionString}`, givenConnectionPassword);
    }

    // Count Query
    const countQuery = parseCountQuery(text, filePath);

    // File parts
    const fileBlocksByTokens = getFileSplitByPitonComment(text);
    const fileParts = map(fileBlocksByTokens, (block, index) => {
        return parsePitonComment(block, index, text, filePathAndName, filePath);
    });

    // show the diagnostics for the file
    PitonLanguageClient.updateDiagnosticCollection(filePathAndName);

    return {
        name: fileName,
        folderPath: filePath,
        connectionString,
        connectionUser,
        runScheduleCron,
        sqlDialect,
        parts: fileParts,
        skip: !!skip,

        countQuery,
    };
}

/** Split file on -- pn-check */
function getFileSplitByPitonComment(file: string): string[] {
    const sqlDialectRegex = /\s.*?(?=\-\-\s+?pn\-check.*?\r?\n)/gi;
    return file.split(sqlDialectRegex);
}

/** Takes a comment and sql underneath and pulls out query data */
function parsePitonComment(filePart: string, order: number, file: string, filePathAndName: string, filePath: string): PitonFilePart {
    const nameRegex = /\s*?\-\-\s+?pn\-name\s(.*?)\s*?\r?\n/gi;
    const name = (nameRegex.exec(filePart) || [])[1];
    const checkRegex = /\s*?\-\-\s+?pn\-check\s(.*?)\s*?\r?\n/gi;
    const isTypeCheck = (checkRegex.exec(filePart) || [])[0];

    const idColumnRegex = /\s*?\-\-\s+?pn\-id-col\s(.*?)\s*?\r?\n/gi;
    const idColumn = (idColumnRegex.exec(filePart) || [])[1];
    const approveColumnRegex = /\s*?\-\-\s+?pn\-approve-col\s(.*?)\s*?\r?\n/gi;
    const approveColumn = (approveColumnRegex.exec(filePart) || [])[1];

    const expectRegex = /\s*?\-\-\s+?pn\-expect\s(.*?)\s*?\r?\n/gi;
    const expect = (expectRegex.exec(filePart) || [])[1];
    const expectColumnRegex = /\s*?\-\-\s+?pn\-expectColumn\s(.*?)\s*?\r?\n/gi;
    const expectColumn = (expectColumnRegex.exec(filePart) || [])[1];
    const expectColumnValueRegex = /\s*?\-\-\s+?pn\-expectColumnValue\s(.*?)\s*?\r?\n/gi;
    const expectColumnValue = (expectColumnValueRegex.exec(filePart) || [])[1];

    let sanitizedQuery = parseCheckQuery(filePart);
    if (!!sanitizedQuery) {
        sanitizedQuery = sanitizedQuery.replace('pn-filePath', filePath);
    }

    const checkNoNewlineRegex = /\s*?\-\-\s+?pn\-check/gi;
    const line = (getLineNumber(file, checkNoNewlineRegex)[order - 1] || { number: 0 })?.number;

    let isCheckParamsValid = true;
    if (!!isTypeCheck && !idColumn) { 
        isCheckParamsValid = false;
        PitonLanguageClient.addDiagnosticErrors(filePathAndName, new Range(line, 0, line, 100), 'missing pn-id-col for pn-check');
        OutputChannelLogger.error(`====== SYNTAX ERROR ======\nmissing pn-id-col for pn-check #${order}\n${filePart}`, true);
    }
    if (!!isTypeCheck && !sanitizedQuery) {
        isCheckParamsValid = false;
        PitonLanguageClient.addDiagnosticErrors(filePathAndName, new Range(line, 0, line, 100), 'missing SELECT for pn-check');
        OutputChannelLogger.error(`====== SYNTAX ERROR ======\nmissing SELECT for pn-check #${order}\n${filePart}`, true);
    }

    return {
        rawText: filePart,
        order,
        range: new Range(line, 0, line, 0),
        name,
        skip: false,

        type: (!!isTypeCheck && isCheckParamsValid) ? 'Check' : 'Other',
        idColumn,
        approveColumn: approveColumn || 'approved',
        
        expect: 'no_results',
        expectColumn,
        expectColumnValue,
        sanitizedQuery,
    };
}

/**
 * Returns the SQL query 
 */
function parseCountQuery(filePart: string, filePath: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-count.*?\r?\n(?:\-\-[\w\W]*?\r?\n)*?\s*?((SELECT|WITH)[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    let query = exec[1];

    if (!!query) {
        query = query.replace('pn-filePath', filePath);
    }

    return query;
}

/**
 * Returns the SQL query 
 */
function parseCheckQuery(filePart: string): string {
    const countQueryRegex = /\s*?\-\-\s+?pn\-check.*?\r?\n(?:\-\-[\w\W]*?\r?\n)\s*?((SELECT|WITH)[\w\W]+?)\r?\n(?:--|\s+?)/gi;
    const exec = countQueryRegex.exec(filePart) || [];
    const query = exec[1];
    return query;
}

function getLineNumber(str: string, re: RegExp) {
    return str.split(/\n/).map(function (line, i) {
        if (re.test(line)) {
            return {
                line: line,
                number: i,
                match: (line.match(re) || [])[0]
            };
        }
    }).filter(Boolean);
}
