// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const { WebClient } = require('@slack/web-api');

let listeners: Array<vscode.Disposable> = [];
let doc: Map<string, string> = new Map<string, string>();
let client: typeof WebClient = undefined;
let lastSendTime: Date = new Date();
let enableLineLocation: boolean = true;

function fileDetails(document: vscode.TextDocument, selection: vscode.Selection) {
	doc.set("fileName", document.fileName);
    doc.set("lineLocation", document.lineCount.toString());
}

export function setSlackStatus() {
    fileDetails(vscode.window.activeTextEditor.document, vscode.window.activeTextEditor.selection);

    const now = new Date();
    const timeSinceLastSend = now.getTime() - lastSendTime.getTime();
    console.log(timeSinceLastSend);
    if (timeSinceLastSend < 5000) {
        return;
    } else {
        let status: string = `Working on: ${doc.get("fileName")}`;
        if (enableLineLocation) {
            status += `At Line: ${doc.get("lineLocation") === undefined ? 0 : doc.get("lineLocation")}`;
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
    return vscode.workspace.getConfiguration('slack-status');
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "slack-status" is now active!');

    const configuration = getConfiguration();

    const token: string = configuration.get("slackToken", undefined);
    enableLineLocation = configuration.get("enableLineLocation", true);

    if (token === undefined || token === '') {
        vscode.window.showErrorMessage('Slack token is undefined. Please set your Slack token in the settings.');
    } else {
        client = new WebClient(token);
    
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

// This method is called when your extension is deactivated
export function deactivate() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	listeners.forEach((listener) => listener.dispose());
	listeners = [];
    client.users.profile.set({
        profile: {
            status_text: 'Offline',
            status_emoji: ':zzz:',
            status_expiration: 0
        }
    }).then((res: any) => {
        console.log('Response: ', res);
    }).catch(console.error);
}
