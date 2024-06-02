import { WebviewViewProvider, WebviewView, Uri, WebviewViewResolveContext, CancellationToken, Webview } from 'vscode';
import { getPitonResultSummary } from '../file/file';
import { map, reduce } from 'lodash';

/**
 * 
 */
export class PitonSummaryViewProvider implements WebviewViewProvider {

	public static readonly viewType = 'pitonSummaryReport';

	private _view?: WebviewView;

	constructor(
		private readonly _extensionUri: Uri,
	) { }

	public resolveWebviewView(
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		_token: CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						// Do something
						break;
					}
			}
		});
	}

	public show() {
		if (this._view) {
			this._view.show?.(true);
		}
	}

	public addColor() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addColor' });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearColors' });
		}
	}

	/** Returns a string of HTML to render */
	private _getHtmlForWebview(webview: Webview): string {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'resources', 'webview', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'resources', 'webview', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'resources', 'webview', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'resources', 'webview', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = this._getNonce();

		const pitonResults = getPitonResultSummary() || [];
		const pitonPassed = reduce<number>(map(pitonResults, r => r.count - r.toBeReviewedCount - r.errorCount), (prev, r) => {
			if (prev === undefined) { return r; }
			return prev + r;
		}) || 0;
		const pitonTotal = reduce<number>(map(pitonResults, r => r.count), (prev, r) => { 
			if (prev === undefined) { return r; }
			return prev + r;
		}) || 0;

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Piton Summary</title>
			</head>
			<body>
				<div>${pitonPassed}/${pitonTotal}
				</div>
				<ul class="color-list">
				</ul>

				<button class="add-color-button">Add Color</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/** Generate a nonce */
	private _getNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
