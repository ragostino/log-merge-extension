import * as vscode from 'vscode';
import { mergeLogs } from './merge';
export function activate(context) {
    const disposable = vscode.commands.registerCommand('logMerge.mergeLogs', async () => {
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            filters: { 'Log files': ['log', 'txt'] }
        });
        if (!files)
            return;
        const output = await mergeLogs(files);
        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'mergedlog'
        });
        vscode.window.showTextDocument(doc);
    });
    context.subscriptions.push(disposable);
}
export function deactivate() { }
