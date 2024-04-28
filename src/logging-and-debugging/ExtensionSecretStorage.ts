import { json2csv } from "json-2-csv";
import { take } from "lodash";
import { ExtensionContext, OutputChannel, SecretStorage, window } from "vscode";

export class ExtensionSecretStorage {

    public static secretStorage: SecretStorage;

    private constructor() {  }

    public static activate(context: ExtensionContext) {
        ExtensionSecretStorage.secretStorage = context.secrets;
    }
}