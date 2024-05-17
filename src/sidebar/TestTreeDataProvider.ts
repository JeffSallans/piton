import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFileDictionary, getFileResultByName, getFileResultDictionary, getPitonResultSummary, getTests } from '../file/file';
import { map, values } from 'lodash';
import { PitonTestItem } from '../models/PitonTestItem';
import { PitonSummaryItem } from '../models/PitonSummaryItem';
import { PitonTestPartItem } from '../models/PitonTestPartItem';

export class TestTreeDataProvider implements vscode.TreeDataProvider<PitonSummaryItem | PitonTestItem | PitonTestPartItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<PitonSummaryItem | PitonTestItem | PitonTestPartItem | undefined | void> = new vscode.EventEmitter<PitonSummaryItem | PitonTestItem | PitonTestPartItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PitonSummaryItem | PitonTestItem | PitonTestPartItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PitonSummaryItem | PitonTestItem | PitonTestPartItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PitonSummaryItem | PitonTestItem | PitonTestPartItem): Promise<PitonSummaryItem[] | PitonTestItem[] | PitonTestPartItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No PitonTestItem in empty workspace');
			return Promise.resolve([]);
		}

		// Parent
		if (!element) {

			// Don't show any items if no piton file exist
			const pitonTestItems = await this.getPitonTestItems();
			if (pitonTestItems.length === 0) {
				return Promise.resolve([]);
			}

			const pitonResultSummary = getPitonResultSummary();
			return Promise.resolve([new PitonSummaryItem(pitonResultSummary)]);
		}

		// 2nd level
		if (element.contextValue === 'piton_summary') {
			return this.getPitonTestItems();
		}

		// 3rd level
		if (element.contextValue === 'piton_file') {
			return this.getPitonTestPartItems(element as PitonTestItem);
		}

		// 4th level - ignore
		if (element.contextValue === 'piton_check') {
			return Promise.resolve([]);
		}

		return Promise.resolve([]);
	}

	/** Get all the files */
	getPitonTestItems(): Thenable<PitonTestItem[]> {
		const tests = getFileDictionary();
		
		const items = map(values(tests), t => {
			// Null check that shouldn't happen
			if (t === null) { return new PitonTestItem(null, '', '', '', 0, vscode.TreeItemCollapsibleState.None); }
			
			const result = getFileResultByName(t.name);

			const absFilePath = `file:${t.folderPath.replaceAll('\\', '/')}${t.name}`;
			const label = `${t.name}`;
			return new PitonTestItem(
				result,
				label,
				result?.result || 'No Run',
				`${result?.result || 'No Run'} - ${result?.resultSummary || ''}`,
				result?.count || 0,
				((result?.result || 'No Run') === 'No Run') ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded,
				{
					command: 'vscode.open',
					title: label,
					arguments: [vscode.Uri.parse(absFilePath)]
				}
			);
		});
		return Promise.resolve(items);
	}

	/** Get all the checks */
	getPitonTestPartItems(element: PitonTestItem): Thenable<PitonTestPartItem[]> {
		const items = map(element.pitonFileResult?.filePartResults, t => {
			return new PitonTestPartItem(t);
		});
		return Promise.resolve(items);
	}
}
