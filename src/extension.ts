// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { confirmExceptions, confirmSnapshot, getActiveFile, getTests, parseActiveFile, parseAllFiles, renderResults, runActiveFile, runAllFiles } from './file/file';
import { map } from 'lodash';
import { languages } from 'vscode';
import { PitonCodeLensProvider } from './codelens/runner-codelens';
import { TestTreeDataProvider } from './sidebar/TestTreeDataProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    //Create output channel
    //let pitonLog = vscode.window.createOutputChannel("piton");

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "piton" is now active!');

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

	parseAllFiles(rootPath);

	// Samples of `window.registerTreeDataProvider`
	const testTreeDataProvider = new TestTreeDataProvider(rootPath);
	vscode.window.registerTreeDataProvider('pitonFiles', testTreeDataProvider);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('piton.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Piton!');
	});
	context.subscriptions.push(disposable);

	const fileContentsDisposable = vscode.commands.registerCommand('piton.scanDocument', function () {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            let document = editor.document;

			// PARSE
			parseActiveFile(document);
			const parsedData = getActiveFile();
			console.log(`${parsedData.name}: connectionString ${parsedData.connectionString}`);
			map(parsedData.parts, part => {
				console.log(`${part.name}: rawText ${part.rawText}`);
			});

			// Render
			renderResults(vscode.window.activeTextEditor);
        }
    });
	context.subscriptions.push(fileContentsDisposable);


	const runDisposable = vscode.commands.registerCommand('piton.runFile', async () => {
		const editor = vscode.window.activeTextEditor;

        if (editor) {
            let document = editor.document;

			// PARSE
			parseActiveFile(document);
		}

		// RUN
		await runActiveFile();
		const parsedData = getActiveFile();
		console.log(`${parsedData.name}: count ${parsedData.count}`);
		map(parsedData.parts, part => {
			console.log(`${part.order}: result ${part.filePartResult?.result} resultData ${part.filePartResult?.resultData.toString()}`);
		});

		// Render
		renderResults(vscode.window.activeTextEditor);
		testTreeDataProvider.refresh();
	});
	context.subscriptions.push(runDisposable);

	const runAllDisposable = vscode.commands.registerCommand('piton.runAll', async () => {
		// Confirm Exceptions
		await runAllFiles(rootPath);

		// Render
		renderResults(vscode.window.activeTextEditor);
		testTreeDataProvider.refresh();

	});
	context.subscriptions.push(runAllDisposable);

	const exceptionDisposable = vscode.commands.registerCommand('piton.confirmExceptions', () => {
		// Confirm Exceptions
		confirmExceptions();

		// Render
		renderResults(vscode.window.activeTextEditor);
	});
	context.subscriptions.push(exceptionDisposable);

	const snapshotDisposable = vscode.commands.registerCommand('piton.confirmSnapshot', () => {
		// Confirm Snapshot
		confirmSnapshot();

		// Render
		renderResults(vscode.window.activeTextEditor);
	});
	context.subscriptions.push(snapshotDisposable);

	// Get a document selector for the CodeLens provider
	// This one is any file that has the language of javascript
	let docSelector = {
		language: "sql",
		scheme: "file"
	};

	// Register our CodeLens provider
	const codeLensProviderDisposable = languages.registerCodeLensProvider(
		docSelector,
		new PitonCodeLensProvider()
	);
	context.subscriptions.push(codeLensProviderDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
