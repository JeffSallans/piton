import * as vscode from 'vscode';
import * as path from 'path';
import { PitonFilePartResult } from './PitonFilePartResult';

/** Represents the 3rd level of TestTreeDataProvider of a particular check */
export class PitonTestPartItem extends vscode.TreeItem {

	constructor(
		public readonly pitonResult: PitonFilePartResult
	) {		
		super(pitonResult.parsedPart.name || `Check-${pitonResult.parsedPart.order || 0}`, vscode.TreeItemCollapsibleState.None);
		
		this.tooltip = pitonResult.resultMessage;

		if (pitonResult.result === 'To Review') {
			this.description = `${pitonResult.toBeReviewedCount} to review`;
		} else if (pitonResult.result === 'Fail') {
			this.description = `${pitonResult.errorCount} errors`;
		} else {
			this.description = '';
		}

		if (pitonResult.result === 'Pass') {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-success.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-success.svg')
			};
		} else if (pitonResult.result === 'Fail') {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-failure.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-failure.svg')
			};			
		} else if (pitonResult.result === 'Skipped') {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-skip.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-skip.svg')
			};			
		}
		else {
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'pitons-file-norun.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'pitons-file-norun.svg')
			};
		}

		const absFilePath = `file:${pitonResult.resultFilePath.replaceAll('\\', '/')}`;
		this.command = {
			command: 'vscode.open',
			title: 'Open Check Result',
			arguments: [vscode.Uri.parse(absFilePath)]
		};
	}

	contextValue = 'piton_check';
}