import * as vscode from 'vscode';
export async function mergeLogs(files) {
    const allLines = [];
    for (let i = 0; i < files.length; i++) {
        const data = await vscode.workspace.fs.readFile(files[i]);
        const content = Buffer.from(data).toString('utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const ts = extractTimestamp(line);
            if (!ts)
                continue;
            allLines.push({
                timestamp: ts,
                text: line,
                fileIndex: i
            });
        }
    }
    // Ordina per timestamp
    allLines.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    // Colori per file
    const colors = ["red", "blue", "green", "orange", "purple"];
    // Genera output HTML-like (VSCode lo mostra comunque)
    const output = allLines
        .map(l => `[${l.timestamp.toISOString()}] <${colors[l.fileIndex]}> ${l.text}`)
        .join("\n");
    return output;
}
function extractTimestamp(line) {
    // Esempio: 2024-05-01 10:32:12
    const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/;
    const match = line.match(regex);
    if (!match)
        return null;
    return new Date(match[1]);
}
