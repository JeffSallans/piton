import * as vscode from 'vscode';
import * as path from 'path';
import { PitonFile } from './PitonFile';
import { PitonFileResult } from './PitonFileResult';

/** Represents the 2nd level of TestTreeDataProvider of a particular file */
export class PitonTestItem extends vscode.TreeItem {

	constructor(
        public readonly pitonFileResult: PitonFileResult | null,
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
		} else if (result === 'Skipped') {
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
	}

	contextValue = 'piton_file';
}