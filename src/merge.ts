import * as vscode from 'vscode';
import * as fs from 'fs';
import * as readline from 'readline';

const DEBUG = false;

// let patterns: string[] = [];
// let patterns = vscode.workspace
//         .getConfiguration("logMerge")
//         .get<string[]>(
//             "timestampPatterns",
//             []
//         );

const patterns = vscode.workspace
        .getConfiguration("logMerge")
        .get<string[]>(
            "timestampPatterns",
            []
        );

    

//
// Struttura dati usata da extension.ts
//
export interface MergedLine {
    text: string;
    root: string;           // nome file (senza path)
    fileIndex: number;      // indice file 0..19
    fileLineIndex: number;  // numero riga originale
    severityIndex: number;  // 0..5
    timestamp: number;      // timestamp estratto dalla riga
    isFirst: boolean;       // prima riga del file
    isLast: boolean;        // ultima riga del file
    blockId: number;        // id del blocco di timestamp (incrementato ad ogni nuovo timestamp)
}

//
// Mappa severità → indice 0..5
//
function detectSeverity(line: string): number {
    if (line.includes("FATAL")) return 0;
    if (line.includes("ERROR")) return 1;
    if (line.includes("WARN"))  return 2;
    if (line.includes("INFO"))  return 3;
    if (line.includes("DEBUG")) return 4;
    if (line.includes("TRACE")) return 5;
    return 3; // default INFO
}

//
// Estrae timestamp iniziale della riga
//
function extractTimestamp(line: string): number {

    let match =
        line.match(
            /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d{3})/
        );

    if (!match) {
//        match = tryCustomTimestampPatterns(line);
    }

    if (!match) {
        return 0;
    }

    const [_, datePart, msPart] = match;

    return new Date(
        datePart.replace(" ", "T") +
        "." +
        msPart +
        "Z"
    ).getTime();
}


function extractTimestamp0(line: string): number {
    // Formato: 2026-09-15 00:00:00,877
    let match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d{3})/);
    if ( match) {
        const [_, datePart, msPart] = match;
        const date = new Date(datePart.replace(" ", "T") + "." + msPart + "Z");
        return date.getTime();
    }
    
    match = tryCustomTimestampPatterns(line);
      
    if (!match) { return 0; }

    const [_, datePart, msPart] = match;
    const date = new Date(datePart.replace(" ", "T") + "." + msPart + "Z");
    return date.getTime();

}

function tryCustomTimestampPatterns(
    line: string
): RegExpMatchArray | null {

    for (let i = 0; i < patterns.length; i++) {

        const pattern = patterns[i];

        const regex =
            new RegExp(pattern);

        const match =
            line.match(regex);

        if (match) {
            if (DEBUG) {
                console.log(
                    `Timestamp matched using custom pattern #${i + 1}`
                );
            }

            return match;
        }
    }

    return null;
}

function tryCustomTimestampPatterns0(
    line: string
): RegExpMatchArray | null {

    for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        const match = line.match(regex);

        if (match) {
            if (DEBUG) {
                console.log( `Timestamp matched using custom pattern #${pattern}`);
            }
            return match;
        }        
    }

    return null;
}

//
// Funzione principale: merge dei file
//
export async function mergeLogs(
    files: vscode.Uri[],
    progressCallback?: (
        current: number,
        total: number,
        fileName: string
    ) => void
): Promise<{ lines: MergedLine[], text: string }> {

    const allLines: MergedLine[] = [];
    let globalBlockId = 0;
    
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {

        const fileUri = files[fileIndex];
        const root = fileUri.path.split("/").pop() || `file${fileIndex}`;

        if (DEBUG) {
            console.log( "file: ", root );
        }        

        progressCallback?.(
            fileIndex + 1,
            files.length,
            fileUri.path.split('/').pop() ?? fileUri.fsPath
        );

        const stream = fs.createReadStream(fileUri.fsPath);
        const rl = readline.createInterface({ input: stream });

        let fileLineIndex = 0;
        let lastTimestamp = 0;
        let lastSeverityIndex = 3;
        let currentBlockId = 0;

        let collected: MergedLine[] = [];

        for await (const line of rl) {

            if (DEBUG) {
                if (fileLineIndex % 10000 === 0) {
                    const mem =
                        Math.round(
                            process.memoryUsage().rss / 1024 / 1024
                        );
                    console.log(
                        `${root} line=${fileLineIndex} mem=${mem}MB`
                    );
                }
            }        

            let severityIndex = detectSeverity(line);
            let timestamp = extractTimestamp(line);

            if (timestamp === 0) {
                timestamp = lastTimestamp;
                severityIndex = lastSeverityIndex;
            } else {                
                lastTimestamp = timestamp;
                lastSeverityIndex = severityIndex;
                currentBlockId = ++globalBlockId;
            }

            if (fileLineIndex % 10000 === 0) {
                console.log(
                    `line=${fileLineIndex}` +
                    ` objects=${collected.length}` +
                    ` heap=${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
                );
            }

            collected.push({
                text: line,
                root,
                fileIndex,
                fileLineIndex,
                severityIndex,
                timestamp,
                blockId: currentBlockId,
                isFirst: false,
                isLast: false
            });

            fileLineIndex++;
        }

        // Marca prima e ultima riga del file
        if (collected.length > 0) {
            collected[0].isFirst = true;
            collected[collected.length - 1].isLast = true;
        }

        for (const item of collected) {
            allLines.push(item);
        }
        // allLines.push(...collected);
    }

    //
    // Ordina tutte le righe per timestamp
    //
    allLines.sort((a, b) => {
    
         if (a.timestamp !== b.timestamp) {
            return a.timestamp - b.timestamp;
        }

        if (a.blockId !== b.blockId) {
            return a.blockId - b.blockId;
        }

        return a.fileLineIndex - b.fileLineIndex;
        
        // if (a.timestamp !== b.timestamp) {
        //     return a.timestamp - b.timestamp;
        // }
        //  
        // return a.fileLineIndex - b.fileLineIndex;

        // const ta = extractTimestamp(a.text);
        // const tb = extractTimestamp(b.text);
        
        // // if (ta !== tb)
        //     return ta - tb;

        // // if (a.fileIndex !== b.fileIndex)
        // //     return a.fileIndex - b.fileIndex;

        // // return a.fileLineIndex - b.fileLineIndex;

    });

    if (DEBUG) {
        console.log( "Sort completed" );
    }

    //
    // Costruisce il testo finale
    //
    const mergedText = allLines.map(l => l.text).join("\n");

    vscode.window.showInformationMessage(
        `Loaded ${allLines.length} lines`
    );

    return {
        lines: allLines,
        text: mergedText
    };
}
