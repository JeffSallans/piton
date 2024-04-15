import { CodeLens, CodeLensProvider, Command, Position, Range, TextDocument } from "vscode";

export class PitonCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
      let topOfDocument = new Range(0, 0, 0, 0);
        
      let c: Command = {
        command: 'piton.runFile',
        title: '$(debug-start) Run Piton Checks',
      };
  
      let codeLens = new CodeLens(topOfDocument, c);
  
      return [codeLens];
    }
  }