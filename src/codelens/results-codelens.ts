import { CodeLens, CodeLensProvider, Command, Position, Range, TextDocument } from "vscode";
import { getFileByName } from "../file/file";
import { filter, map } from "lodash";

export class PitonResultCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
      const pitonFile = getFileByName(document.fileName);

      if (pitonFile === null) {return [];}

      const codeLens = filter(pitonFile.parts, p => p.filePartResult !== null).map(p => 
        new CodeLens(p.range, {
            command: '',
            title: `${p.filePartResult?.result} - ${p.filePartResult?.resultMessage} on ${p.filePartResult?.lastRun}`
          })
      );
  
      return codeLens;
    }
  }