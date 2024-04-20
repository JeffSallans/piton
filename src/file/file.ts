import { TextDocument, TextEditor, window, } from "vscode";
import * as fs from 'fs';
import { PitonFile } from "../models/PitonFile";
import { getFile, getFileFromDoc } from "./file-parser";
import { runFile } from "./file-runner";
import { updateFile } from "./file-render";
import { Dictionary, forEach, keyBy, map, values } from "lodash";
import { glob } from "glob";
import path from "path";
import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { PitonFileResult } from "../models/PitonFileResult";

/** The parsed files data */
let fileData: Dictionary<PitonFile | null>;

/** A copy of the active file parsing */
let activeFileData: PitonFile;

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
    const fileNameRegex = /^(.*?)(\/|\\)?([^\\\/]+?\.piton\.sql)/gi;
    const results = fileNameRegex.exec(fileAndFolderName) || [];
    const fileName = results[3];
    return fileData[fileName];
}

/** Return the piton result file for the give file name */
export function getFileResultByName(fileAndFolderName: string): PitonFileResult | null {
    const fileNameRegex = /^(.*?)(\/|\\)?([^\\\/]+?\.piton\.sql)/gi;
    const results = fileNameRegex.exec(fileAndFolderName) || [];
    const fileName = results[3];
    if (fileResultData === undefined) { return null; }
    return fileResultData[fileName] || null;
}

/** Return the piton result file for the give file name */
export function getResultSummary() {

}

/** Return the active piton file */
export function getActiveFile(): PitonFile {
    return activeFileData;
}

/** Parse */
export function parseActiveFile(file: TextDocument) {
    // 1. Parse test1.xq.sql
    activeFileData = getFileFromDoc(file);
    fileData[activeFileData.name] = activeFileData;

    // 2. Parse test1.except.csv file
}

/** Run */
export async function runActiveFile() {
    const result = await runFile(activeFileData);
    fileData[activeFileData.name] = activeFileData;
    fileResultData[activeFileData.name] = result;
}


/** Render Results */
export async function renderResults(editor: TextEditor | undefined) {
    if (editor === undefined) { return; }
    // 1. Update File Content
    const files = values(fileResultData);

    for (const f of files) {
        await updateFile(editor, f.parsedFile, f);
    }

    // 2. Update File Explorer
    // 3. Red Underline Failed comments
    // 4. Create Exception file
}

/** Confirm Exceptions */
export function confirmExceptions() {

}

/** Confirm Snapshot */
export function confirmSnapshot() {

}

/** Parse */
export async function parseAllFiles(workspaceRoot: string) {
    const oldfileData = values(fileData);
    fileData = await getTests(workspaceRoot);
}

/** Parse */
export async function runAllFiles(workspaceRoot: string) {
    fileData = await getTests(workspaceRoot);
    for(const file of values(fileData)) {
        if (file === null) { continue; }
        try {
            fileResultData[file.name] = await runFile(file);
        }
        catch (e) {
            window.showErrorMessage(`${e}`);
        }
    }
}

export async function getTests(workspaceRoot: string): Promise<Dictionary<PitonFile | null>> {
    if (workspaceRoot === undefined) { return {}; }

    const pitonfiles = await glob('**/*.piton.sql', { ignore: 'node_modules/**', cwd: workspaceRoot });

    const data = map(pitonfiles, f => {
        const fileLocation = path.join(workspaceRoot, f);
        const fileNameRegex = /^(.+?)(\/|\\)([^\\\/]+?\.piton\.sql)/gi;
        const results = fileNameRegex.exec(fileLocation) || [];

        if (results?.length <= 2 || results[1] === null || results[2] === null) { return null; }

        const text = fs.readFileSync(fileLocation, 'utf8');
        return getFile(`${results[1]}${results[2]}`, results[3], text);
    });

    const dataAsDictionary = keyBy(data, d => d?.name || 'NULL'); 
    return dataAsDictionary;
}
