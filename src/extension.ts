// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const { WebClient } = require('@slack/web-api');

let listeners: Array<vscode.Disposable> = [];
let doc: Map<string, string> = new Map<string, string>();
let client: typeof WebClient = undefined;
let lastSendTime: Date = new Date();

let configuration = getConfiguration();

const statusBarIcon: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarIcon.text = '$(pulse) Connecting to Slack...';

function fileDetails(document: vscode.TextDocument, selection: vscode.Selection) {
    let fileName = document.fileName
    fileName = fileName.split("\\").pop()!;
    fileName = fileName.split("/").pop()!;
	doc.set("fileName", fileName);
    doc.set("fileType", document.languageId);
    doc.set("lineLocation", (selection.active.line + 1).toString());
    doc.set("currentCharacter", (selection.active.character + 1).toString());
    doc.set("totalLines", document.lineCount.toLocaleString());
}

export function setSlackStatus() {
    fileDetails(vscode.window.activeTextEditor.document, vscode.window.activeTextEditor.selection);

    const now = new Date();
    const timeSinceLastSend = now.getTime() - lastSendTime.getTime();
    const configuration = getConfiguration();
    const enableLineLocation = configuration.get("enableLineLocation", true);
    const enableFileType = configuration.get("enableFileType", true);
    const enableTotalLines = configuration.get("enableTotalLines", true);
    // console.log(timeSinceLastSend);
    if (timeSinceLastSend < 5000) {
        return;
    } else {
        let status: string = `Working on: ${doc.get("fileName")}`;
        if (enableFileType) {
            status += ` - ${doc.get("fileType")}`;
        }
        if (enableLineLocation) {
            status += ` - On Line ${doc.get("lineLocation") === undefined ? 0 : doc.get("lineLocation")}`;
            if (enableTotalLines) {
                status += ` of ${doc.get("totalLines")}.`;
            }
        }
        client.users.profile.set({
            profile: {
                status_text: status,
                status_emoji: ':computer:',
                status_expiration: 0
            }
        }).then((res: any) => {
            console.log('Response: ', res);
        }).catch(console.error);
    }
    lastSendTime = new Date();
}

function setupListeners() {
    // const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => setNewDocument(e));
    const onChangeTextDocument = vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => setSlackStatus());

    // listeners.push(onDidChangeActiveTextEditor);
    listeners.push(onChangeTextDocument);
}

function getConfiguration() {
    return vscode.workspace.getConfiguration('slackStatus');
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "slackStatus" is now active!');

	const enable = async (update = true) => {
		if (update) {
			try {
				await configuration.update('enabled', true);
			} catch {}
		}
		console.log(vscode.LogLevel.Info, 'Enable: Cleaning up old listeners');
		cleanUp();
		statusBarIcon.text = '$(pulse) Connecting to Slack...';
		statusBarIcon.show();
		console.log(vscode.LogLevel.Info, 'Enable: Attempting to recreate login');
		void login();
	};

	const disable = async (update = true) => {
		if (update) {
			try {
				await configuration.update('enabled', false);
			} catch {}
		}
		console.log(vscode.LogLevel.Info, 'Disable: Cleaning up old listeners');
		cleanUp();
		console.log(vscode.LogLevel.Info, 'Disable: Destroyed the rpc instance');
		statusBarIcon.hide();
	};
    
	const enabler = vscode.commands.registerCommand('slackStatus.enable', async () => {
		await disable();
		await enable();
		await vscode.window.showInformationMessage('Enabled Slack Status for this workspace');
	});

	const disabler = vscode.commands.registerCommand('slackStatus.disable', async () => {
		await disable();
		await vscode.window.showInformationMessage('Disabled Slack Status for this workspace');
	});

    context.subscriptions.push(enabler, disabler);

    login();

}

function login(){
    configuration = getConfiguration();

    const token: string = configuration.get("slackToken", undefined);
    
    if (token === undefined || token === '') {
        vscode.window.showErrorMessage('Slack token is undefined. Please set your Slack token in the settings and reload.');
		statusBarIcon.text = '$(globe) Missing Slack Token in Settings';
		statusBarIcon.tooltip = 'Add Slack Token in Settings';
        cleanUp();
    } else {
        client = new WebClient(token);
		statusBarIcon.text = '$(globe) Connected to Slack';
		statusBarIcon.tooltip = 'Connected to Slack';
    
        client.users.profile.set({
            profile: {
                status_text: 'Coding...',
                status_emoji: ':computer:',
                status_expiration: 0
            }
        }).then((res: any) => {
            console.log('Response: ', res);
        }).catch(console.error);
    
    
        setupListeners();
    }
}

function cleanUp() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	listeners.forEach((listener) => listener.dispose());
	listeners = [];
    if (client !== undefined) {
        client.users.profile.set({
            profile: {
                status_text: 'Offline',
                status_emoji: ':zzz:',
                status_expiration: 0
            }
        }).then((res: any) => {
            console.log('Response: ', res);
        }).catch(console.error);

        client = undefined;
    }
}

// This method is called when your extension is deactivated
export function deactivate() {
    cleanUp();
}
