import { json2csv } from "json-2-csv";
import { take } from "lodash";
import { Disposable, ExtensionContext, OutputChannel, SecretStorage, window } from "vscode";

/** Used to store database passwords securly */
export class ExtensionSecretStorage {

    /** Exposing the VS Code Secret Storage instance */
    public static secretStorage: SecretStorage;

    private constructor() {  }

    /** Call to setup secret storage singleton */
    public static activate(context: ExtensionContext) {
        ExtensionSecretStorage.secretStorage = context.secrets;
    }

    /** Call to setup secret for testing */
    public static mockActivate() {
        ExtensionSecretStorage.secretStorage = {
            get: function(key) {
                return Promise.resolve('PASSWORD');
            },
            store: function(key, value) {
                return Promise.resolve();
            },
            delete: function(key) {
                return Promise.resolve();
            },
            onDidChange: (e) => new Disposable(() => {})
        };
    }
}