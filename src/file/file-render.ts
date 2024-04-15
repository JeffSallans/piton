// Render Results

import { Position, Range, TextDocument, TextEditor } from "vscode";
import { PitonFile } from "../models/PitonFile";
import { get, isNull } from "lodash";

    // 1. Update File Content
export async function updateFile(editor: TextEditor, file: PitonFile) {
    const resultRegex = /\s*?\-\-\s+?pn\-result\s(.*?)\s*?\r?\n/gi;
    const word = editor.document.getWordRangeAtPosition(new Position(0, 0), resultRegex) || new Range(0, 0, 0, 0);

    if (word.start.line === 0 && word.start.character === 0 && word.end.line === 0 && word.end.character === 0) { return; }

    editor.edit(editBuilder => {
        editBuilder.replace(word, get(file, 'parts[1].filePartResult?.result', 'Fail'));
    });
}
    /*
    		editor.edit(editBuilder => {
				editBuilder.replace(selection, reversed);
			});
    */
    // 2. Update File Explorer
    // 3. Red Underline Failed comments
    // 4. Create Exception file