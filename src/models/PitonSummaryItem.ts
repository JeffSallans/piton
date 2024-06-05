import * as vscode from 'vscode';
import * as path from 'path';
import { PitonResultSummary } from './PitonResultSummary';
import { filter } from 'lodash';

/** Represents the 1st level of TestTreeDataProvider */
export class PitonSummaryItem extends vscode.TreeItem {

	constructor(
		public readonly pitonSummary: PitonResultSummary[]
	) {
		super('Piton Files', vscode.TreeItemCollapsibleState.Expanded);

		const passCount = filter(pitonSummary, (s: PitonResultSummary) => s.result === 'Pass').length;
		const totalCount = pitonSummary.length;

		this.description = `${passCount}/${totalCount} checks pass`;

		this.iconPath = {
			light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-norun.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-norun.svg')
		};

		// Root path will be referenced later to help with parsing files and used in pn-filePath
		const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

		const absFilePath = `file:${path.join(rootPath.replaceAll('\\', '/'), 'result.piton.csv')}`;
		this.command = {
			command: 'piton.showSummary',
			title: 'Open Summary',
			arguments: []
		};
	}

	contextValue = 'piton_summary';
}