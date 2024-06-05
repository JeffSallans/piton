
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    window.openVscodeFile = function(filePath) {
        vscode.postMessage({
            command: 'vscode.open',
            text: filePath
        });
    };

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                counter.textContent = `${currentCount}`;
                break;
        }
    });
}());
