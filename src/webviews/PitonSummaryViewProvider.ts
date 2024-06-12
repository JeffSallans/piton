import { Uri, Webview, window, ViewColumn, WebviewPanel, Disposable, WebviewOptions } from 'vscode';
import { defaultTo, filter, map, max, sortBy, values } from 'lodash';
import { commands } from 'vscode';
import { getFilePartResult, getFileResultDictionary, getPitonResultSummary } from '../file/file';
import { PitonResultSummary } from '../models/PitonResultSummary';
import { PitonFilePartResult } from '../models/PitonFilePartResult';

/**
 * The summary report webview panels
 */
export class PitonSummaryViewProvider {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: PitonSummaryViewProvider | undefined;

	public static readonly viewType = 'pitonSummary';

	private readonly _panel: WebviewPanel;
	private readonly _extensionUri: Uri;
	private _disposables: Disposable[] = [];

	private pitonToReviewIconUri: string;

	public static createOrShow(extensionUri: Uri) {
		const column = window.activeTextEditor
			? window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (PitonSummaryViewProvider.currentPanel) {
			PitonSummaryViewProvider.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = window.createWebviewPanel(
			PitonSummaryViewProvider.viewType,
			'Piton Summary',
			column || ViewColumn.One,
			PitonSummaryViewProvider.getWebviewOptions(extensionUri),
		);

		PitonSummaryViewProvider.currentPanel = new PitonSummaryViewProvider(panel, extensionUri);
	}

	public static revive(panel: WebviewPanel, extensionUri: Uri) {
		PitonSummaryViewProvider.currentPanel = new PitonSummaryViewProvider(panel, extensionUri);
	}

	private constructor(panel: WebviewPanel, extensionUri: Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						window.showErrorMessage(message.text);
						return;
					case 'vscode.open':
						const uri = Uri.parse(`file:${message.text.replaceAll('\\', '/')}`);
						commands.executeCommand('vscode.open', uri);
						return;
				}
			},
			null,
			this._disposables
		);

		this.pitonToReviewIconUri = '';
	}

	public doRerender() {

		// Get Pass/Fail Counts
		const pitonResults = getPitonResultSummary() || [];
		const passCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Pass').length;
		const failCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Fail').length;
		const noRunCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'No Run').length;
		const skippedCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Skipped').length;
		const toReviewCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'To Review').length;
		const totalCount = pitonResults.length;

		// Get toReviewFiles
		const filePartResults = getFilePartResult() || [];
		const toReviewFiles = sortBy(filter(filePartResults, (r: PitonFilePartResult) => r.result === 'To Review'), r => r.toBeReviewedCount);

		// Get file minimap data
		const fileResults = values(getFileResultDictionary());
		const fileMinimap = map(fileResults, r => {
			const errorAndToReviewCounts = map(r.filePartResults, partResult => partResult.errorCount);
			const maxErrorsAndToReview = max(errorAndToReviewCounts) || 0;

			return {
				label: r.parsedFile.name,
				filePath: `${r.parsedFile.parts[0].filePath}`,
				x: defaultTo((1.0 - (maxErrorsAndToReview/r.count)) * 100.0, 0),
				y: r.filePartResults.length,
				r: 7
			};
		});
		const fileMinimapLabels = map(fileMinimap, m => m.label);

		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({
			command: 'rerender',
			passCount,
			failCount,
			toReviewCount,
			pitonToReviewIconUri: this.pitonToReviewIconUri,
			toReviewFiles,
			fileMinimap,
			fileMinimapLabels,
		});
	}

	public dispose() {
		PitonSummaryViewProvider.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.title = 'Piton Summary';
		this._panel.webview.html = this._getHtmlForWebview(webview);
		this.doRerender();
	}

	private _getHtmlForWebview(webview: Webview) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'main.js');
		const chartPathOnDisk = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'chart.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const chartUri = webview.asWebviewUri(chartPathOnDisk);

		// Local path to css styles
		const styleResetPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'reset.css');
		const stylesPathMainPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'main.css');
		const pitonToReviewIconPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'pitons-file-failure.svg');
		const bookStackPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'doc-icon.svg');
		const githubIconPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'github-icon.svg');
		const feedbackIconPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'feedback-icon.svg');
		const issueIconPath = Uri.joinPath(this._extensionUri, 'resources', 'webview', 'issue-icon.svg');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		const bookStackUri = webview.asWebviewUri(bookStackPath);
		const githubIconUri = webview.asWebviewUri(githubIconPath);
		const feedbackIconUri = webview.asWebviewUri(feedbackIconPath);
		const issueIconUri = webview.asWebviewUri(issueIconPath);

		this.pitonToReviewIconUri = webview.asWebviewUri(pitonToReviewIconPath).toString();

		// Use a nonce to only allow specific scripts to be run
		const nonce = this.getNonce();

		const pitonResults = getPitonResultSummary() || [];
		const passCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Pass').length;
		const failCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Fail').length;
		const noRunCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'No Run').length;
		const skippedCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'Skipped').length;
		const toReviewCount = filter(pitonResults, (s: PitonResultSummary) => s.result === 'To Review').length;
		const totalCount = pitonResults.length;

		const filePartResults = getFilePartResult() || [];

		const toReviewFiles = sortBy(filter(filePartResults, (r: PitonFilePartResult) => r.result === 'To Review'), r => r.toBeReviewedCount);

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Piton Summary</title>
			</head>
			<body>
				<div class="links">
					<div class="links--col">
						<div>
							<a title="Documentation" href="https://github.com/JeffSallans/piton/blob/master/documentation.md" target="_blank"><img class="links--col--img" src="${bookStackUri}" /></a>
							<a title="Github" href="https://github.com/JeffSallans/piton" target="_blank"><img class="links--col--img" src="${githubIconUri}" /></a>
							<a title="Report an issue" href="https://github.com/JeffSallans/piton/issues/new" target="_blank"><img class="links--col--img" src="${issueIconUri}"/></a>
							<a title="Give Feedback" href="https://forms.gle/q6QHgYXA2x73Muv29" target="_blank"><img class="links--col--img" src="${feedbackIconUri}" /></a>
						</div>
					</div>
				</div>
				<div class="summary">
					<div class="summary--col summary--col-passfail">
						<h2>Results</h2>
						<div>
							<canvas id="passFailChart"></canvas>
						</div>
					</div>
					<div id="filesToReview" class="summary--col summary--col-results">
						<h2>Files To Review</h2>
						<div class="summary--col--resultsitem">
							<span>(no files)</span>
						</div>
					</div>
				</div>
				<div class="fileMap">
					<h2>File Landscape</h2>
					<div class="fileMap--chart">
						<canvas id="fileMapChart"></canvas>
					</div>
				</div>

				<script nonce="${nonce}" src="${chartUri}"></script>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	public static getWebviewOptions(extensionUri: Uri): WebviewOptions {
		return {
			// Enable javascript in the webview
			enableScripts: true,
	
			// And restrict the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [Uri.joinPath(extensionUri, 'resources', 'webview'), Uri.joinPath(extensionUri, 'resources', 'dark'), Uri.joinPath(extensionUri, 'resources', 'light')]
		};
	}
}

