// Render Results

import { Position, Range, TextDocument, TextEditor } from "vscode";
import * as fs from 'fs';
import { get, isNull } from "lodash";
import { json2csv } from "json-2-csv";

import { PitonFile } from "../models/PitonFile";
import { PitonFileResult } from "../models/PitonFileResult";

export async function updateFile(editor: TextEditor, file: PitonFile, fileResult: PitonFileResult) {
    /*
    // 1. Update File Content
    const resultRegex = /\s*?\-\-\s+?pn\-result\s(.*?)\s*?\r?\n/gi;
    const word = editor.document.getWordRangeAtPosition(new Position(0, 0), resultRegex) || new Range(0, 0, 0, 0);

    if (word.start.line === 0 && word.start.character === 0 && word.end.line === 0 && word.end.character === 0) { return; }

    editor.edit(editBuilder => {
        editBuilder.replace(word, get(file, 'parts[1].filePartResult?.result', 'Fail'));
    });
    */

    // 2. Update File Explorer
    // Done

    // 3. Red Underline Failed comments
    // TODO

    // 4. Create Exception file
    for (const p of file.parts) {
        const result = fileResult.filePartResults[p.order];
        if (result !== undefined && result.resultData.length > 0) {
            createCSVFile(result.resultFilePath, result.resultData);
        }
    }
}

/** Writes the json object to the given file path. If a file exists, the file is overwritten */
function createCSVFile(filePath: string, data: object[]) {
    const csvString = json2csv(data, {});
    fs.writeFileSync(filePath, csvString);
}
