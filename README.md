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

To preserve responsiveness on very large datasets, ambiguity highlighting may be automatically limited.

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

The current severity filter is displayed in the VS Code status bar and is applied dynamically without reloading log files.

---

### Source File Filtering

Dynamically include or exclude files from the merged view.

Useful when analyzing large datasets containing many log sources.

Selected files can be changed at any time without reloading the logs.

The current file selection is displayed in the VS Code status bar.

Source file filtering and severity filtering can be combined.

---

### Live Statistics

The extension continuously displays the number of visible log entries versus the total number of loaded log entries.

Example:

```text
7,336 / 114,476
```

This provides immediate feedback about the impact of active filters.

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

## Status Bar Indicators

The extension provides real-time status information.

| Indicator | Description |
|------------|------------|
| Filter | Active severity filter |
| Files | Selected files / total files |
| Lines | Visible log lines / total log lines |

These indicators are updated automatically after every merge and filtering operation.

---

## Recommended Theme

The extension includes a dedicated theme:

```text
Merged Log Theme
```

The extension will suggest enabling it to obtain the best visual experience.

---

## Custom Timestamp Patterns

The extension first tries its built-in timestamp parser.

If no timestamp is detected, additional user-defined regular expressions are evaluated sequentially until a matching pattern is found.

Patterns are evaluated in the configured order.

The first matching expression is used.

Example:

```json
{
    "logMerge.timestampPatterns": [
        "(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}),(\\d{3})",
        "(\\d{4}/\\d{2}/\\d{2} \\d{2}:\\d{2}:\\d{2})\\.(\\d{3})"
    ]
}
```

Each expression must provide:

- Capture group 1: date and time
- Capture group 2: milliseconds

---

## Typical Use Cases

- Telecom troubleshooting
- Distributed applications
- REST API diagnostics
- HTTP/S and JWT analysis
- Microservice investigations
- Multi-threaded applications
- Integration debugging
- Production incident analysis
- Distributed system correlation
- Performance and timing analysis

---

## Example Workflow

1. Open multiple log files.
2. Execute **Merge Logs**.
3. Inspect the unified timeline.
4. Apply severity filtering.
5. Reduce the view to relevant files.
6. Investigate timestamp ambiguity groups when present.
7. Use hover information to locate the original source line.

---

## Limitations

The extension relies on timestamp information available in log files.

When multiple events share exactly the same timestamp, their true execution order may not be determinable.

In these situations, the extension highlights the affected log entries to alert the analyst.

Custom timestamp patterns currently require:

- Capture group 1 = date and time
- Capture group 2 = milliseconds

---

## Version

Current version: 0.0.1

---

## License

MIT License

