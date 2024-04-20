import { CodeLens, CodeLensProvider, Command, Position, Range, TextDocument } from "vscode";
import { getFileByName, getFileResultByName } from "../file/file";
import { filter, map } from "lodash";

export class PitonResultCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
      const pitonResultFile = getFileResultByName(document.fileName);

      if (pitonResultFile === null) {return [];}

      const codeLens = map(pitonResultFile.filePartResults, p => 
        new CodeLens(p.parsedPart.range, {
            command: '',
            title: `${p.result} - ${p.resultMessage} on ${p.lastRun}`
          })
      );
  
      return codeLens;
    }
  }