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

let currentSeverityFilter = "ALL";
let filterStatusBarItem: vscode.StatusBarItem;

let mergedLines: MergedLine[] = [];
let allMergedLines: MergedLine[] = [];

const ambiguityDecorationType =
    vscode.window.createTextEditorDecorationType({
            //isWholeLine: true,
            backgroundColor: 'rgba(128,128,255,0.06)'
    });

const boundaryDecorationType =
    vscode.window.createTextEditorDecorationType({});
    

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


//
// 🔥 TABELLA COLORI (duplicata dal tema mergedlog-theme.json)
//
function getMarkerColor(fileIndex: number): string {
    return fileBaseColors[fileIndex % fileBaseColors.length];
}

function formatTimestamp(timestamp: number): string {

    const d = new Date(timestamp);

    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const mmm = String(d.getMilliseconds()).padStart(3, '0');

    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss},${mmm}`;
}

async function checkTheme() {
    const currentTheme =
        vscode.workspace
            .getConfiguration('workbench')
            .get<string>('colorTheme');

    if (currentTheme !== 'Merged Log Theme') {

        // vscode.window.showWarningMessage(
        //     'Per visualizzare correttamente i colori dell\'unione log è consigliato il tema "Merged Log Theme".'
        // );
    
            const result = await vscode.window.showInformationMessage(
                'Per visualizzare correttamente i colori dei log è consigliato attivare il tema "Merged Log Theme".',
                'Attiva tema',
                'Ignora' );

            if (result === 'Attiva tema') {
                await vscode.workspace
                .getConfiguration('workbench')
                .update(
                    'colorTheme',
                    'Merged Log Theme',
                    vscode.ConfigurationTarget.Global
                );  
            }
        
    }
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
                                      "│  ";

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

    editor.setDecorations(boundaryDecorationType, decorations);
}


function applyTimestampAmbiguityDecorators() {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const decorations: vscode.DecorationOptions[] = [];

    let start = 0;

    while (start < mergedLines.length) {

        const ts = mergedLines[start].timestamp;

        let end = start;

        while (
            end + 1 < mergedLines.length &&
            mergedLines[end + 1].timestamp === ts
        ) {
            end++;
        }

        const groupSize = end - start + 1;
        
        if (groupSize > 1) {
            for (let line = start; line <= end; line++) {

                decorations.push({
                    range: new vscode.Range(
                        line,
                        0,
                        line,
                        editor.document.lineAt(line).text.length
                    ),
                    hoverMessage:
                        `⚠ Gruppo temporale ambiguo\n\n` +
                        `Eventi nel gruppo: ${groupSize}\n` +
                        `Timestamp: ${formatTimestamp(ts)}\n\n` +
                        `L'ordine causale potrebbe non essere determinabile.`
                });
            }
        }

        start = end + 1;
    }

    editor.setDecorations(
        ambiguityDecorationType,
        decorations
    );
}

async function applySeverityFilter() {

    const selected = await vscode.window.showQuickPick(
        [
            'ALL',
            'TRACE',
            'DEBUG',
            'INFO',
            'WARN',
            'ERROR',
            'FATAL'
        ],
        {
            title: 'Minimum severity'
        }
    );

    if (!selected) {
        return;
    }

    currentSeverityFilter = selected;
    filterStatusBarItem.text = `$(filter) ${currentSeverityFilter}+`;

    const thresholds: Record<string, number> = {
        FATAL: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
        TRACE: 5
    };

    if (selected === 'ALL') {
        mergedLines = [...allMergedLines];

    } else {

        const threshold = thresholds[selected];
        mergedLines =
            allMergedLines.filter(
                l => l.severityIndex <= threshold
            );
    }

    await rebuildMergedDocument();
}

async function rebuildMergedDocument() {

    const text =
        mergedLines
            .map(l => l.text)
            .join('\n');

    const uri =
        vscode.Uri.parse('untitled:merged-output');

    const doc =
        await vscode.workspace.openTextDocument(uri);

    await vscode.languages.setTextDocumentLanguage(
        doc,
        'mergedlog'
    );

    const edit = new vscode.WorkspaceEdit();

    const fullRange = new vscode.Range(
        doc.positionAt(0),
        doc.positionAt(doc.getText().length)
    );

    edit.replace(
        uri,
        fullRange,
        text
    );


    await vscode.workspace.applyEdit(edit);

    await vscode.window.showTextDocument(doc);

    applyFileBoundaryDecorators();
    applyTimestampAmbiguityDecorators();
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

    filterStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    filterStatusBarItem.text = "$(filter) ALL";
    filterStatusBarItem.tooltip = "Filtro severità attivo";
    filterStatusBarItem.command = "logMerge.filterSeverity";
    filterStatusBarItem.show();

    context.subscriptions.push(filterStatusBarItem);

    const disposable = vscode.commands.registerCommand(
        'logMerge.mergeLogs',
        async () => {
            const files = await vscode.window.showOpenDialog({
                canSelectMany: true,
                filters: { 'Log files': ['log', 'txt'] }
            });

            if (!files) return;

            const result = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Merging log files...",
                    cancellable: false
                },
                async (progress) => {

                    progress.report({
                        message: `Reading ${files.length} files...`
                    });

                    const result = await mergeLogs(
                        files,
                        (current, total, fileName) => {

                            progress.report({
                                message: `Reading ${current}/${total}: ${fileName}`,
                                increment: 100 / total
                            });

                        }
                    );
                    
                    progress.report({
                        message: "Building merged view..."
                    });

                    return result;
                }
            );

            // mergedLines = result.lines;

            allMergedLines = result.lines;
            mergedLines = [...allMergedLines];


            const uri = vscode.Uri.parse('untitled:merged-output');
            let doc = await vscode.workspace.openTextDocument(uri);
            await vscode.languages.setTextDocumentLanguage(doc, 'mergedlog');

            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), result.text);
            await vscode.workspace.applyEdit(edit);

            await vscode.window.showTextDocument(doc);
            await checkTheme();

            applyFileBoundaryDecorators();
            applyTimestampAmbiguityDecorators();
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
  
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'logMerge.filterSeverity',
            applySeverityFilter
        )
    );
}

export function deactivate() {}

