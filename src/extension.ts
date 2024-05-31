// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { approveExceptions, denyExceptions, getActiveFile, getFileResultByName, getTests, parseActiveFile, parseAllFiles, renderResults, runActiveFile, runAllFiles, updatePassword } from './file/file';
import { map } from 'lodash';
import { languages } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PitonCodeLensProvider } from './codelens/runner-codelens';
import { TestTreeDataProvider } from './sidebar/TestTreeDataProvider';
import { PitonResultCodeLensProvider } from './codelens/results-codelens';
import { PitonLanguageClient } from './language/PitonLanguageClient';
import postgres from './sql-dialects/postgres';
import duckdb from './sql-dialects/duckdb';
import sqllite from './sql-dialects/sqlite';
import { OutputChannelLogger } from './logging-and-debugging/OutputChannelLogger';
import { ExtensionSecretStorage } from './logging-and-debugging/ExtensionSecretStorage';
import { PitonTestPartItem } from './models/PitonTestPartItem';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "piton" is now active!');

	// Setup secret store for database passwords
	ExtensionSecretStorage.activate(context);

	// Setup Piton autocomplete, diagnostic, and hover info
	let languageDisposibles = PitonLanguageClient.activate();
	for (const disposable of languageDisposibles) {
		context.subscriptions.push(disposable);
	}

	// Root path will be referenced later to help with parsing files and used in pn-filePath
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

	// Do an initial parse to get an accurate state of things when activating the extension
	parseAllFiles(rootPath, promptPassword);

	// Registers the main test result tree view
	const testTreeDataProvider = new TestTreeDataProvider(rootPath);
	vscode.window.registerTreeDataProvider('pitonFiles', testTreeDataProvider);

	const fileContentsDisposable = vscode.commands.registerCommand('piton.scanDocument', async () => {
		OutputChannelLogger.log('Parsing file');

		// Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            let document = editor.document;

			// PARSE
			await parseActiveFile(document, promptPassword);

			// Render
			await renderResults(rootPath);
        }
    });
	context.subscriptions.push(fileContentsDisposable);


	const runDisposable = vscode.commands.registerCommand('piton.runFile', async () => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Running Piton File'
		}, async (progress, cancelilation) => {
			
			cancelilation.onCancellationRequested(cancelConnections);

			progress.report({  increment: 0 });
			const editor = vscode.window.activeTextEditor;

			if (editor) {
				let document = editor.document;
				// PARSE
				parseActiveFile(document, promptPassword);
			}

			progress.report({ increment: 20 });

			// RUN
			await runActiveFile(editor);

			progress.report({ increment: 80 });

			// Render
			await renderResults(rootPath);
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
		await renderResults(rootPath);
		testTreeDataProvider.refresh();
	});
	context.subscriptions.push(parseAllDisposable);

	const runAllDisposable = vscode.commands.registerCommand('piton.runAll', async () => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Running Piton File'
		}, async (progress, cancelilation) => {
			
			cancelilation.onCancellationRequested(cancelConnections);

			progress.report({  increment: 0 });
		
			// Confirm Exceptions
			await runAllFiles(rootPath, progress, cancelilation, promptPassword);

			// Render
			await renderResults(rootPath);
			testTreeDataProvider.refresh();

			await Promise.resolve();
		
			progress.report({ increment: 100 });
		});
	});
	context.subscriptions.push(runAllDisposable);

	const createExampleDisposable = vscode.commands.registerCommand('piton.createExample', async () => {
		vscode.window.showInformationMessage('Creating Example Piton File');

		// Confirm Exceptions
		fs.cpSync(path.join(__filename, '..', '..', 'resources','piton-example'), path.join(rootPath, 'piton-example'), {recursive: true});

		// Render
		testTreeDataProvider.refresh();
	});
	context.subscriptions.push(createExampleDisposable);

	const approveDisposable = vscode.commands.registerCommand('piton.approveFilePart', async (pitonTestPartItem: PitonTestPartItem) => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Approving Piton File'
		}, async (progress, cancelilation) => {
			
			cancelilation.onCancellationRequested(cancelConnections);

			progress.report({  increment: 0 });

			// Confirm Exceptions
			await approveExceptions(rootPath, pitonTestPartItem.pitonResult);
			progress.report({  increment: 80 });

			// Render exceptions
			testTreeDataProvider.refresh();
			progress.report({  increment: 100 });
		});
	});
	context.subscriptions.push(approveDisposable);

	const denyDisposable = vscode.commands.registerCommand('piton.denyFilePart', async (pitonTestPartItem: PitonTestPartItem) => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
			title: 'Denying Piton File'
		}, async (progress, cancelilation) => {
			
			cancelilation.onCancellationRequested(cancelConnections);

			progress.report({  increment: 0 });

			// Deny Exceptions
			await denyExceptions(rootPath, pitonTestPartItem.pitonResult);
			progress.report({  increment: 80 });

			// Render exceptions
			testTreeDataProvider.refresh();
			progress.report({  increment: 100 });
		});
	});
	context.subscriptions.push(denyDisposable);

	const updatePasswordDisposable = vscode.commands.registerCommand('piton.updatePassword', function () {
		vscode.window.showInformationMessage('Updated Password');

		// Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            let document = editor.document;
			updatePassword(editor, promptPassword);
        }
    });
	context.subscriptions.push(updatePasswordDisposable);


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

/** Used to clean up the SQL connections */
async function cancelConnections() {
	vscode.window.showInformationMessage("DB Connections Cancelled");
	OutputChannelLogger.log('====== DB Connections Cancelled ======');
	postgres.closeConnection();
	duckdb.closeConnection();
	sqllite.closeConnection();
	return;
}

/** Passed into the business logic functions to call this vscode utility when needed */
async function promptPassword(user: string): Promise<string> {
	const result = await vscode.window.showInputBox({
		title: `Password for ${user}`,
		password: true,
	});
	return result || '';
}

// This method is called when your extension is deactivated
export function deactivate() {}
