
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    openVscodeFile = function(filePath) {
        vscode.postMessage({
            command: 'vscode.open',
            text: filePath
        });
    };

    const button = document.querySelector('.review-file1-button')
    button.addEventListener('click', () => {
        const pnFilePath = button.getAttribute('pnFilePath');
        console.log('openning file: ' + pnFilePath);
        openVscodeFile(pnFilePath);
    });

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
