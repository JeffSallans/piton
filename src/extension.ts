// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { confirmExceptions, confirmSnapshot, getActiveFile, getFileResultByName, getTests, parseActiveFile, parseAllFiles, renderResults, runActiveFile, runAllFiles } from './file/file';
import { map } from 'lodash';
import { languages } from 'vscode';
import { PitonCodeLensProvider } from './codelens/runner-codelens';
import { TestTreeDataProvider } from './sidebar/TestTreeDataProvider';
import { PitonResultCodeLensProvider } from './codelens/results-codelens';
import { PitonLanguageClient } from './language/PitonLanguageClient';
import postgres from './sql-dialects/postgres';
import duckdb from './sql-dialects/duckdb';
import { OutputChannelLogger } from './logging-and-debugging/OutputChannelLogger';
import { ExtensionSecretStorage } from './logging-and-debugging/ExtensionSecretStorage';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    //Create output channel
    //let pitonLog = vscode.window.createOutputChannel("piton");

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "piton" is now active!');

	ExtensionSecretStorage.activate(context);

	let completeItemDisposible = PitonLanguageClient.activate();
	context.subscriptions.push(completeItemDisposible);

	let diagnosticDisposible = PitonLanguageClient.activateDiagnostic();
	context.subscriptions.push(diagnosticDisposible);

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

	parseAllFiles(rootPath, promptPassword);

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
		vscode.window.showInformationMessage('Parsing file');

		// Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            let document = editor.document;

			// PARSE
			parseActiveFile(document, promptPassword);
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
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: false,
			title: 'Running Piton File'
		}, async (progress) => {
			
			progress.report({  increment: 0 });

			const editor = vscode.window.activeTextEditor;

			if (editor) {
				let document = editor.document;

				// PARSE
				parseActiveFile(document, promptPassword);
			}

			progress.report({ increment: 20 });

			// RUN
			await runActiveFile();
			const parsedData = getActiveFile();
			const parsedResult = getFileResultByName(parsedData.name);
			if (parsedResult !== null) {
				console.log(`${parsedData.name}: count ${parsedResult.count}`);
				map(parsedResult.filePartResults, partResult => {
					console.log(`${partResult.parsedPart.order}: result ${partResult.result} resultData ${partResult.resultData.toString()}`);
				});
			}

			progress.report({ increment: 80 });

			// Render
			renderResults(vscode.window.activeTextEditor);
			testTreeDataProvider.refresh();
		
			await Promise.resolve();
		
			progress.report({ increment: 100 });
		});
	});
	context.subscriptions.push(runDisposable);

	const parseAllDisposable = vscode.commands.registerCommand('piton.parseAll', async () => {
		vscode.window.showInformationMessage('Parsing all files');

		// Confirm Exceptions
		await parseAllFiles(rootPath, promptPassword);

		// Render
		renderResults(vscode.window.activeTextEditor);
		testTreeDataProvider.refresh();
	});
	context.subscriptions.push(parseAllDisposable);

	const runAllDisposable = vscode.commands.registerCommand('piton.runAll', async () => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Running Piton File'
		}, async (progress, cancelilation) => {
			
			cancelilation.onCancellationRequested(() => {
	  
			  vscode.window.showInformationMessage("DB Connections Cancelled");
			  OutputChannelLogger.log('====== DB Connections Cancelled ======');
			  postgres.closeConnection();
			  duckdb.closeConnection();
			  return;
			});

			progress.report({  increment: 0 });
		
			// Confirm Exceptions
			await runAllFiles(rootPath, progress, cancelilation, promptPassword);

			// Render
			renderResults(vscode.window.activeTextEditor);
			testTreeDataProvider.refresh();

			await Promise.resolve();
		
			progress.report({ increment: 100 });
		});
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

	// Register our CodeLens result provider
	const codeLensResultProviderDisposable = languages.registerCodeLensProvider(
		docSelector,
		new PitonResultCodeLensProvider()
	);
	context.subscriptions.push(codeLensResultProviderDisposable);

	// Run parsing on save
	const onSaveDisposible = vscode.workspace.onDidSaveTextDocument((e) => {
		const isActiveFile = e === vscode.window.activeTextEditor?.document;
		if (isActiveFile && vscode.window?.activeTextEditor !== undefined && vscode.window?.activeTextEditor?.document !== undefined) {
			parseActiveFile(vscode.window.activeTextEditor.document, promptPassword);
		}
	});
	context.subscriptions.push(onSaveDisposible);
}

async function promptPassword(user: string): Promise<string> {
	const result = await vscode.window.showInputBox({
		title: `Password for ${user}`,
		password: true,
	});
	return result || '';
}

// This method is called when your extension is deactivated
export function deactivate() {}