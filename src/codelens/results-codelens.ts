import { CodeLens, CodeLensProvider, Command, Position, Range, TextDocument, Uri } from "vscode";
import { getFileByName, getFileResultByName } from "../file/file";
import { filter, map } from "lodash";
import dayjs from "dayjs";

export class PitonResultCodeLensProvider implements CodeLensProvider {

    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
      const pitonResultFile = getFileResultByName(document.fileName);

      if (pitonResultFile === null) {return [];}

      const codeLens = map(pitonResultFile.filePartResults, p => 
        new CodeLens(p.parsedPart.range, {
            command: 'vscode.open',
            title: `${p.result} - ${p.resultMessage} on ${p.lastRun.format('MMM D h:mm:ssa')}`,
            arguments: [Uri.parse(`file:${p.resultFilePath}`)]
          })
      );
  
      return codeLens;
    }
  }