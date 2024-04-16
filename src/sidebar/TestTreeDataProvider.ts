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
			// Null check that shouldn't happen
			if (t === null) { return new PitonTestItem('', '', '', 0, vscode.TreeItemCollapsibleState.None); }
			
			const absFilePath = `file:${t.folderPath.replaceAll('\\', '/')}${t.name}`;
			const label = `${t.name}`;
			return new PitonTestItem(
				label,
				t.result,
				`${t.result} - ${t.resultSummary}`,
				t.count,
				vscode.TreeItemCollapsibleState.None,
				{
					command: 'vscode.open',
					title: label,
					arguments: [vscode.Uri.parse(absFilePath)]
				}
			);
		});
		return Promise.resolve(items);
	}
}

export class PitonTestItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly result: string,
		public readonly tooltip: string,
		public readonly rowCount: number,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = tooltip;
		this.description = `${rowCount} records`;

		if (result === 'Pass') {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-success.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-success.svg')
			};
		} else if (result === 'Fail') {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-failure.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-failure.svg')
			};			
		}
		else {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-norun.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-norun.svg')
			};
		}
	}

	contextValue = 'dependency';
}