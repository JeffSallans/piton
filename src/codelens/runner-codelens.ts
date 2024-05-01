import { map } from "lodash";
import { CodeLens, CodeLensProvider, Command, Position, Range, TextDocument } from "vscode";

export class PitonCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
      let topOfDocument = new Range(0, 0, 0, 0);
        
      let commands: Command[] = [
        {
          command: 'piton.runFile',
          title: '$(debug-start) Run Piton Checks'
        },
        {
          command: 'piton.updatePassword',
          title: 'Update Password'
        }
      ];
  
      let codeLens = map(commands, c => new CodeLens(topOfDocument, c));
  
      return codeLens;
    }
  }