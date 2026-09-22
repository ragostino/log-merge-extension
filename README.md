# Log Merge Extension

Log Merge Extension is a Visual Studio Code extension that merges multiple log files into a single chronological view, preserving source information and enhancing readability through colors, severity highlighting, and advanced filtering capabilities.

Designed for troubleshooting, telecom analysis, distributed systems diagnostics, and large-scale log investigations.

---

## Features

### Chronological Log Merge

Merge multiple log files into a single timeline ordered by timestamp.

Supported log entries are automatically sorted chronologically, allowing events coming from different files to be analyzed in a unified view.

---

### Source File Identification

Each line keeps track of its original source file.

Visual markers are displayed in the editor:

| Symbol | Meaning |
|----------|----------|
| ▶ | First line from a file |
| │ | Intermediate lines from a file |
| ◀ | Last line from a file |

Each source file receives its own visual color.

---

### Severity Highlighting

Log entries are colored according to their severity level:

- FATAL
- ERROR
- WARN
- INFO
- DEBUG
- TRACE

Severity colors are provided through semantic highlighting and the bundled **Merged Log Theme**.

---

### Timestamp Ambiguity Detection

When multiple events share exactly the same timestamp, the extension highlights those lines.

This helps identify situations where:

- Multiple source files produce events within the same millisecond
- Multiple threads write to the same log
- Temporal ordering alone may not reflect true execution order

An informative tooltip explains the ambiguity.

---

### Severity Filtering

Filter the merged log by minimum severity:

- TRACE
- DEBUG
- INFO
- WARN
- ERROR
- FATAL

Examples:

| Filter | Visible Levels |
|----------|----------|
| INFO | INFO, WARN, ERROR, FATAL |
| WARN | WARN, ERROR, FATAL |
| ERROR | ERROR, FATAL |

The current filter is shown in the VS Code status bar.

---

### Source File Filtering

Dynamically include or exclude files from the merged view.

Useful when analyzing large datasets containing many log sources.

Selected files can be changed at any time without reloading the logs.

---

### Large Log Support

The extension has been optimized to handle large datasets containing tens of thousands of log entries.

Performance-sensitive visual decorations are automatically managed to maintain editor responsiveness when handling very large logs.

---

### Progress Feedback

A progress notification shows merge status while processing multiple files:

- Reading files
- Building merged view

This provides feedback when working with large log collections.

---

### Original Source Information

Hovering a log line shows:

- Source file
- Original line number

making it easy to locate the entry in the original log.

---

## Commands

### Merge Logs

Open and merge multiple log files.

Command:

```text
Merge Logs
```

---

### Filter Severity

Apply a severity filter.

Command:

```text
Log Merge: Filter Severity
```

---

### Filter Files

Select which source files should be visible.

Command:

```text
Log Merge: Filter Files
```

---

## Recommended Theme

The extension includes a dedicated theme:

```text
Merged Log Theme
```

The extension will suggest enabling it to obtain the best visual experience.

---

## Typical Use Cases

- Telecom troubleshooting
- Distributed applications
- REST API diagnostics
- HTTP/S and JWT 


================================================================================================
Italian version

# log-merge-extension

E' un'estensione per Visual Code di Microsoft.
Consente  di miscelare più files di logs  ordinando le righe cronologicamente, in un unico file.

Per richiamare l'estensione,  digitare i tasti: "Shift + Ctrl + P" e scrivere: "Merge Logs"; nella finestra che comparirà selezionari tutti i files interessati dal periodo che si sta esaminando e quindi Invio.

Dopo qualche minuto, apparirà un unico file, ottenuto dalla miscelazione di tutti i files.

Ogni file sarà contraddistinto da un colore, ogni riga assumerà una sfumatura di quel colore in funzione del livello di gravità del tracciamento.

Criticità note: poichè la granularità del timestamp è il millisecondo, può capitare, in particolare tra files diversi, che alcune righe possano non essere nel reale ordine cronologico.
