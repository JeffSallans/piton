import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFileDictionary, getTests } from '../file/file';
import { map, values } from 'lodash';

export class TestTreeDataProvider implements vscode.TreeDataProvider<PitonTestItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<PitonTestItem | undefined | void> = new vscode.EventEmitter<PitonTestItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PitonTestItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PitonTestItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: PitonTestItem): Thenable<PitonTestItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No PitonTestItem in empty workspace');
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve([]);
		}

		const tests = getFileDictionary();
		
		const items = map(values(tests), t => {
			const absFilePath = `file:${t?.folderPath.replaceAll('\\', '/')}${t?.name}`;
			let statusIcon = 'O';
			if (t?.errorCount !== undefined && t?.errorCount > 0) {
				statusIcon = 'X';
			}
			const label = `${statusIcon} ${t?.name}\t${t?.count}`;
			return new PitonTestItem(label, vscode.TreeItemCollapsibleState.None, {
				command: 'vscode.open',
				title: label,
				arguments: [vscode.Uri.parse(absFilePath)]
			});
		});
		return Promise.resolve(items);
	}
}

export class PitonTestItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = '';
		this.description = '';
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'pitons.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'pitons.svg')
	};

	contextValue = 'dependency';
}