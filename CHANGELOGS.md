# Changelog

## Version 0.1.1

### Fixed

- Fixed `Maximum call stack size exceeded` when processing very large log files.
- Replaced bulk array insertion using spread operator with incremental insertion to support hundreds of thousands of log lines.
- Improved handling of large datasets during merge operations.

### Added

- Custom timestamp pattern configuration through VS Code settings.
- Support for multiple timestamp patterns evaluated sequentially.
- Status bar line counter showing visible lines versus total merged lines.
- Automatic hiding of Log Merge status bar indicators when the merged document is closed.
- Keyboard shortcut support for opening the merge command.

### Improved

- Timestamp ambiguity detection now considers logical timestamp blocks.
- Better handling of multiline log sections such as:
  - Java stack traces
  - Parameter dumps
  - SQL error reports
  - Other multiline diagnostic entries

- Improved stability when processing datasets containing hundreds of thousands of log lines.
- Reduced diagnostic logging in production mode.
- Refactoring and cleanup of timestamp parsing logic.

### UI

- Added custom extension icon.
- Improved visibility and behavior of status bar indicators.
- Better integration with the bundled **Merged Log Theme**.

### Performance

- Improved scalability during file loading and merge operations.
- Optimized decoration handling for large merged files.
- Optimized ambiguity highlighting thresholds.

---

## Version 0.1.0

### Initial Release

- Chronological merge of multiple log files.
- Severity highlighting.
- File-based coloring.
- File and severity filtering.
- Timestamp ambiguity detection.
- Semantic highlighting.
- Status bar integration.
- Dedicated Merged Log Theme.