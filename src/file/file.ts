import { CancellationToken, Progress, TextDocument, TextEditor, window, } from "vscode";
import * as fs from 'fs';
import { PitonFile } from "../models/PitonFile";
import { getFile, getFileFromDoc } from "./file-parser";
import { runFile } from "./file-runner";
import { getResultSummary, updateFileResults, updateResultsSummary } from "./file-render";
import { Dictionary, ceil, floor, forEach, keyBy, keys, map, values } from "lodash";
import { glob } from "glob";
import path from "path";
import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { PitonFileResult } from "../models/PitonFileResult";
import { PitonLanguageClient } from "../language/PitonLanguageClient";
import { ExtensionSecretStorage } from "../logging-and-debugging/ExtensionSecretStorage";
import { PitonResultSummary } from "../models/PitonResultSummary";
import { approveFilePart, denyFilePart } from "./file-approver";

/** The parsed files data */
let fileData: Dictionary<PitonFile | null>;

/** The results from the file runs */
let fileResultData: Dictionary<PitonFileResult> = {};

/** Return all piton files keyed by file name */
export function getFileDictionary(): Dictionary<PitonFile | null> {
    return fileData;
}

/** Return all piton files results keyed by file name */
export function getFileResultDictionary(): Dictionary<PitonFileResult> {
    return fileResultData;
}


/** Return the piton file for the give file name */
export function getFileByName(fileAndFolderName: string): PitonFile | null {
    const fileNameRegex = /^(.*?)(\/|\\)?([^\\\/]+?\.piton\.sql)$/gi;
    const results = fileNameRegex.exec(fileAndFolderName) || [];
    const fileName = results[3];
    return fileData[fileName];
}

/** Return the piton result file for the give file name */
export function getFileResultByName(fileAndFolderName: string): PitonFileResult | null {
    const fileNameRegex = /^(.*?)(\/|\\)?([^\\\/]+?\.piton\.sql)$/gi;
    const results = fileNameRegex.exec(fileAndFolderName) || [];
    const fileName = results[3];
    if (fileResultData === undefined) { return null; }
    return fileResultData[fileName] || null;
}

/**
 * Parse the current open file into a Piton
 * @param editor 
 * @returns 
 */
export function getActiveFile(editor: TextEditor | undefined): PitonFile | null {
    if (editor === undefined) { return null; }

    const activeFileData = getFileByName(editor.document.fileName);

    if (activeFileData === null) { return null; }

    return activeFileData;
}

/** Return the piton result file for the give file name */
export function getPitonResultSummary(): PitonResultSummary[] {
    return getResultSummary(fileResultData);
}

/** Parse */
export async function parseActiveFile(file: TextDocument, promptPassword: (user: string) => Promise<string>) {
    // Check if active file is *.piton.sql
    const fileNameRegex = /^(.+?)(\/|\\)([^\\\/]+?\.piton\.sql)$/gi;
    const results = fileNameRegex.exec(file.fileName) || [];
    if (results.length === 0) {
        return;
    }

    // Parse *.piton.sql
    const activeFileData = await getFileFromDoc(file, promptPassword);
    fileData[activeFileData.name] = activeFileData;
}

/** Run */
export async function runActiveFile(editor: TextEditor | undefined) {
    if (editor === undefined) { return; }

    const activeFileData = getFileByName(editor.document.fileName);

    if (activeFileData === undefined || activeFileData === null) { return; }

    const result = await runFile(activeFileData);
    fileData[activeFileData.name] = activeFileData;
    fileResultData[activeFileData.name] = result;
}

/** Run */
export async function runFileByFilePart(pitonFilePartResult: PitonFilePartResult | undefined) {
    if (pitonFilePartResult?.parsedPart.fileName === undefined) { return; }

    const activeFileData = getFileByName(pitonFilePartResult?.parsedPart.fileName);

    if (activeFileData === undefined || activeFileData === null) { return; }

    const result = await runFile(activeFileData);
    fileData[activeFileData.name] = activeFileData;
    fileResultData[activeFileData.name] = result;
}


/** Render Results */
export async function renderResults(workspaceRoot: string) {
    // 1. Create/Update Result File
    updateResultsSummary(workspaceRoot, fileResultData);

    // 2. Create Exception file
    const files = values(fileResultData);

    for (const f of files) {
        await updateFileResults(f.parsedFile, f);
    }
}

/** Confirm Exceptions */
export async function approveExceptions(workspaceRoot: string, pitonTestPartItem: PitonFilePartResult) {
    if (pitonTestPartItem === undefined) { return; }
    await approveFilePart(pitonTestPartItem);
    await runFileByFilePart(pitonTestPartItem);
    await renderResults(workspaceRoot);
}

/** Deny Exceptions */
export async function denyExceptions(workspaceRoot: string, pitonTestPartItem: PitonFilePartResult) {
    if (pitonTestPartItem === undefined) { return; }
    await denyFilePart(pitonTestPartItem);
    await runFileByFilePart(pitonTestPartItem);
    await renderResults(workspaceRoot);
}

/** Update Password */
export async function updatePassword(editor: TextEditor | undefined, promptPassword: (user: string) => Promise<string>) {
    if (editor === undefined) { return; }

    const file = getFileByName(editor.document.fileName);
    ExtensionSecretStorage.secretStorage.delete(`${file?.connectionString}`);

    const givenConnectionPassword = await promptPassword(`${file?.connectionString}`);
    await ExtensionSecretStorage.secretStorage.store(`${file?.connectionString}`, givenConnectionPassword);

}

/** Parse */
export async function parseAllFiles(workspaceRoot: string, promptPassword: (user: string) => Promise<string>) {
    const oldfileData = values(fileData);
    fileData = await getTests(workspaceRoot, promptPassword);
}

/** Parse */
export async function runAllFiles(workspaceRoot: string, progress: Progress<{message?:string, increment?:number}>, cancelilation: CancellationToken, promptPassword: (user: string) => Promise<string>) {
    fileData = await getTests(workspaceRoot, promptPassword);
    const numberOfFiles = values(fileData).length;
    let index = 0;
    for(const file of values(fileData)) {
        index++;
        if (cancelilation.isCancellationRequested) { return; }
        if (file === null) { continue; }
        try {
            fileResultData[file.name] = await runFile(file);
            progress.report({  increment: floor((index / numberOfFiles) * 100) });
        }
        catch (e) {
            window.showErrorMessage(`${e}`);
        }
    }
}

/**
 * Return all PitonFiles under workspaceRoot
 * @param workspaceRoot 
 * @param promptPassword 
 * @returns 
 */
export async function getTests(workspaceRoot: string, promptPassword: (user: string) => Promise<string>): Promise<Dictionary<PitonFile | null>> {
    if (workspaceRoot === undefined) { return {}; }

    const pitonfiles = await glob('**/*.piton.sql', { ignore: ['node_modules/**','*.csv'], cwd: workspaceRoot });

    let data = [];
    for (const f of pitonfiles) {
        const fileLocation = path.join(workspaceRoot, f);
        const fileNameRegex = /^(.+?)(\/|\\)([^\\\/]+?\.piton\.sql)$/gi;
        const results = fileNameRegex.exec(fileLocation) || [];

        if (results?.length <= 2 || results[1] === null || results[2] === null) {
            data.push(null);
            continue;
        }

        const text = fs.readFileSync(fileLocation, 'utf8');
        const result = await getFile(`${results[1]}${results[2]}`, results[3], text, promptPassword);
        data.push(result);
    }

    const dataAsDictionary = keyBy(data, d => d?.name || 'NULL'); 
    return dataAsDictionary;
}
