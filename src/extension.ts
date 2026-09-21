import * as vscode from 'vscode';
import { mergeLogs, MergedLine } from './merge';

//
// 🔥 120 TOKEN SEMANTICI: file0_sev0 … file19_sev5
//
const tokenTypesLegend = Array.from(
    { length: 120 },
    (_, i) => `file${Math.floor(i / 6)}_sev${i % 6}`
);

const tokenTypes = new Map<string, number>();
tokenTypesLegend.forEach((t, i) => tokenTypes.set(t, i));

export const legend = new vscode.SemanticTokensLegend(tokenTypesLegend, []);

let mergedLines: MergedLine[] = [];

const fileBaseColors: string[] = [

    // ===== BLOCCO 1 - SATURI =====
    "#FF0000", // Rosso
    "#FF7F00", // Arancione
    "#FFFF00", // Giallo
    "#00FF00", // Verde
    "#00FFFF", // Ciano
    "#0000FF", // Blu
    "#8B00FF", // Viola

    // ===== BLOCCO 2 - SCURI =====
    "#8B0000", // Rosso scuro
    "#CC5500", // Arancione scuro
    "#B8860B", // Giallo scuro
    "#006400", // Verde scuro
    "#008B8B", // Ciano scuro
    "#00008B", // Blu scuro
    "#4B0082", // Indaco

    // ===== BLOCCO 3 - PASTELLO =====
    "#FF6666", // Rosso pastello
    "#FFB366", // Arancione pastello
    "#FFFF99", // Giallo pastello
    "#99FF99", // Verde pastello
    "#99FFFF", // Ciano pastello
    "#9999FF", // Blu pastello
    "#D699FF"  // Viola pastello
];

const fileBaseColors1: string[] = [
    "#FF3300", // file0
    "#FF8800", // file1
    "#FF0000", // file2
    "#FF7F00", // file3
    "#FFFF00", // file4
    "#00FF00", // file5
    "#00FFFF", // file6
    "#0080FF", // file7
    "#0000FF", // file8
    "#8000FF", // file9
    "#FF00FF", // file10
    "#FF0080", // file11
    "#FF6666", // file12
    "#FFCC00", // file13
    "#CCFF00", // file14
    "#00FFCC", // file15
    "#0099FF", // file16
    "#6600FF", // file17
    "#CC00FF", // file18
    "#FF0066"  // file19
];

const fileBaseColors2: string[] = [
    "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#4B0082", "#8A2BE2",
    "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#4B0082", "#8A2BE2",
    "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#4B0082", "#8A2BE2",
    "#FF00FF", "#FF1493", "#00BFFF", "#7FFF00", "#FFD700", "#FF4500", "#2E8B57",
    "#708090", "#8B4513", "#556B2F", "#9932CC", "#DC143C", "#20B2AA", "#2E8B57",
];

//
// 🔥 TABELLA COLORI (duplicata dal tema mergedlog-theme.json)
//
/*
function getMarkerColor(fileIndex: number): string {
    return fileBaseColors[fileIndex] ?? "#FFFFFF";
} */
function getMarkerColor(fileIndex: number): string {
    return fileBaseColors[fileIndex % fileBaseColors.length];
}

//
// 🔥 DECORATORI FILE BOUNDARY
//
function applyFileBoundaryDecorators() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const decorations: vscode.DecorationOptions[] = [];

    for (let i = 0; i < mergedLines.length; i++) {
        const info = mergedLines[i];

        const prefix = info.isFirst ? "▶ " :
                       info.isLast  ? "◀ " :
                                      "│ ";

        const color = getMarkerColor(info.fileIndex);

        decorations.push({
            range: new vscode.Range(i, 0, i, 2),
            renderOptions: {
                before: {
                    contentText: prefix,
                    color,
                    margin: "0 4px 0 0"
                }
            }
        });
    }

    const decorationType = vscode.window.createTextEditorDecorationType({});
    editor.setDecorations(decorationType, decorations);
}

//
// 🔥 PROVIDER SEMANTICO
//
class LogSemanticTokenProvider implements vscode.DocumentSemanticTokensProvider {

    provideDocumentSemanticTokens(
        document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.SemanticTokens> {

        const builder = new vscode.SemanticTokensBuilder(legend);

        for (let line = 0; line < document.lineCount; line++) {

            const info = mergedLines[line];
            if (!info) continue;

            const tokenName = `file${info.fileIndex}_sev${info.severityIndex}`;
            const tokenIndex = tokenTypes.get(tokenName);

            if (tokenIndex !== undefined) {
                builder.push(
                    line,
                    0,
                    document.lineAt(line).text.length,
                    tokenIndex,
                    0
                );
            }
        }

        return builder.build();
    }
}

//
// 🔥 ATTIVAZIONE ESTENSIONE
//
export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand(
        'logMerge.mergeLogs',
        async () => {
            const files = await vscode.window.showOpenDialog({
                canSelectMany: true,
                filters: { 'Log files': ['log', 'txt'] }
            });

            if (!files) return;

            const result = await mergeLogs(files);
            mergedLines = result.lines;

            const uri = vscode.Uri.parse('untitled:merged-output');
            let doc = await vscode.workspace.openTextDocument(uri);
            await vscode.languages.setTextDocumentLanguage(doc, 'mergedlog');

            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), result.text);
            await vscode.workspace.applyEdit(edit);

            await vscode.window.showTextDocument(doc);

            applyFileBoundaryDecorators();
        }
    );

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'mergedlog' },
            new LogSemanticTokenProvider(),
            legend
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider('mergedlog', {
            provideHover(document, position) {
                const line = position.line;
                const info = mergedLines[line];
                if (!info) return;

                return new vscode.Hover(
                    `File: **${info.root}**\nRiga nel file: ${info.fileLineIndex + 1}`
                );
            }
        })
    );
}

export function deactivate() {}

