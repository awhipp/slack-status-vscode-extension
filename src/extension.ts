// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const { WebClient } = require('@slack/web-api');

let charactersWritten: Map<string, number> = new Map();
let linesWritten: Map<string, number> = new Map();
let currentDocument: vscode.TextDocument;
let listeners: Array<vscode.Disposable> = [];
let client: typeof WebClient = undefined;
let lastSendTime: Date = new Date();

export function setNewDocument(e: vscode.TextEditor | undefined) {
    /**
     * If the event is undefined, then the user has closed all documents.
     */
    if (e === undefined) {
        return;
    }

    /**
     * If the event is defined, then the user has opened a new document.
     */
    if (e.document) {
        currentDocument = e.document;
        if (!charactersWritten.has(e.document.fileName)) {
            charactersWritten.set(e.document.fileName, 0);
        }
        if (!linesWritten.has(e.document.fileName)) {
            linesWritten.set(e.document.fileName, 0);
        }
    }
}

export function setSlackStatus(e: vscode.TextDocumentChangeEvent) {
    if (e.document && currentDocument === undefined) {
        currentDocument = e.document;
        if (!charactersWritten.has(e.document.fileName)) {
            charactersWritten.set(e.document.fileName, 0);
        }
        if (!linesWritten.has(e.document.fileName)) {
            linesWritten.set(e.document.fileName, 0);
        }
    }

    if (e.contentChanges && currentDocument !== undefined) {
        console.log(`==============================================`);
        console.log(`Current document: ${currentDocument.fileName}`);
        
        /**
         * Update the number of characters written for a given document.
         */
        if (charactersWritten.has(currentDocument.fileName)) {
            charactersWritten.set(
                currentDocument.fileName, 
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                charactersWritten.get(currentDocument.fileName) + e.contentChanges[0].text.length // ing
            );
            console.log(`Characters written: ${charactersWritten.get(currentDocument.fileName)}`);
        }

        /**
         * Update the number of lines written for a given document.
         */
        if (linesWritten.has(currentDocument.fileName)) {
            if (e.contentChanges[0].text.includes('\n') || e.contentChanges[0].text.includes('\r\n') || e.contentChanges[0].text.includes('\r')) {
                linesWritten.set(
                    currentDocument.fileName,
                    linesWritten.get(currentDocument.fileName) + 1
                )
            }
            console.log(`Lines written: ${linesWritten.get(currentDocument.fileName)}`);
        }
        
        const now = new Date();
        const timeSinceLastSend = now.getTime() - lastSendTime.getTime();
        console.log(timeSinceLastSend);
        if (timeSinceLastSend < 5000) {
            return;
        } else {
            const status = `File: ${currentDocument.fileName} | Lines: ${linesWritten.get(currentDocument.fileName)} | Characters: ${charactersWritten.get(currentDocument.fileName)}`;
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
}

function setupListeners() {
    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => setNewDocument(e));
    const onChangeTextDocument = vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => setSlackStatus(e));

    listeners.push(onDidChangeActiveTextEditor);
    listeners.push(onChangeTextDocument);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "slack-status" is now active!');

    const token: string = 'GET TOKEN FROM https://api.slack.com/apps/';
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
