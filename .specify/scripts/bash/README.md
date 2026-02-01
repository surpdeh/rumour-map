# Spec-Kit Bash Scripts

This directory contains automation scripts for the Spec-Kit development workflow.

## Scripts Overview

### `implement-feature.sh`

Automates the feature implementation workflow by validating prerequisites and setting up the project for implementation.

**Usage:**
```bash
./implement-feature.sh [FEATURE_DIR]
```

**Arguments:**
- `FEATURE_DIR` (optional): Path to the feature specification directory (e.g., `specs/001-google-sheets-integration`)
  - If not provided, uses current branch to determine feature directory

**What it does:**
1. ✅ **Parse tasks.md** - Validates that tasks.md exists in the feature directory
2. ✅ **Check checklists status** - Scans all checklist files and displays completion status:
   - Shows a formatted table with total/completed/incomplete counts
   - Prompts user for confirmation if any checklist is incomplete
   - Auto-proceeds if all checklists are complete
3. ✅ **Load implementation context** - Validates required files:
   - Required: `plan.md`, `tasks.md`
   - Optional: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`
4. ✅ **Verify project setup** - Creates/updates ignore files:
   - Detects if project uses Git, Docker, ESLint, Prettier, etc.
   - Creates or updates `.gitignore`, `.dockerignore`, `.eslintignore`, etc.
   - Only adds missing patterns, preserves existing configuration
5. ℹ️ **Next steps** - Provides clear guidance for manual implementation

**Example output:**
```
[INFO] Feature directory: /path/to/specs/001-google-sheets-integration
[SUCCESS] Found tasks.md
[INFO] Checking checklist status...

| Checklist            | Total | Completed | Incomplete | Status |
|----------------------|-------|-----------|------------|--------|
| requirements.md      | 16    | 16        | 0          | ✓ PASS |

[SUCCESS] All checklists complete!
[INFO] Loading implementation context...
[SUCCESS] Found plan.md
[SUCCESS] Found tasks.md
...
```

**Exit codes:**
- `0` - Success, prerequisites validated
- `1` - Error (missing files, invalid directory, etc.)

**Notes:**
- Steps 5-9 (actual task execution) require manual implementation or AI agent assistance
- The script only validates prerequisites and sets up the environment
- Task execution must follow the plan in `tasks.md` manually

---

### `check-prerequisites.sh`

Validates prerequisite files for the Spec-Kit workflow.

**Usage:**
```bash
./check-prerequisites.sh [OPTIONS]
```

**Options:**
- `--json` - Output in JSON format
- `--require-tasks` - Require tasks.md to exist (for implementation phase)
- `--include-tasks` - Include tasks.md in AVAILABLE_DOCS list
- `--paths-only` - Only output path variables (no validation)
- `--help, -h` - Show help message

**Example:**
```bash
# Check task prerequisites (plan.md required)
./check-prerequisites.sh --json

# Check implementation prerequisites (plan.md + tasks.md required)
./check-prerequisites.sh --json --require-tasks --include-tasks

# Get feature paths only (no validation)
./check-prerequisites.sh --paths-only
```

---

### `common.sh`

Common functions and variables used by all scripts. Should be sourced by other scripts.

**Key functions:**
- `get_repo_root()` - Returns repository root directory
- `get_current_branch()` - Returns current branch or feature directory name
- `has_git()` - Checks if git is available
- `check_feature_branch()` - Validates feature branch naming convention
- `get_feature_dir()` - Returns feature directory path
- `find_feature_dir_by_prefix()` - Finds feature directory by numeric prefix
- `get_feature_paths()` - Returns all feature-related paths
- `check_file()` - Checks if file exists and prints status
- `check_dir()` - Checks if directory exists and is non-empty

**Usage:**
```bash
#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

eval $(get_feature_paths)
echo "Feature directory: $FEATURE_DIR"
```

---

### `create-new-feature.sh`

Creates a new feature directory structure with template files.

---

### `setup-plan.sh`

Sets up the planning phase for a feature.

---

### `update-agent-context.sh`

Updates agent context files with the latest information.

---

## Development Guidelines

### Adding a New Script

1. Create the script file: `my-script.sh`
2. Make it executable: `chmod +x my-script.sh`
3. Add shebang: `#!/usr/bin/env bash`
4. Source common functions: `source "$(dirname "${BASH_SOURCE[0]}")/common.sh"`
5. Add error handling: `set -e`
6. Add help message with `--help` flag
7. Document the script in this README

### Best Practices

- **Always use absolute paths** internally
- **Quote all variable expansions** to handle spaces: `"$VAR"`
- **Use `local` for function variables** to avoid pollution
- **Provide clear error messages** with context
- **Exit with appropriate codes**: `0` for success, `1` for error
- **Add color output** for better UX:
  - `${RED}...${NC}` for errors
  - `${GREEN}...${NC}` for success
  - `${YELLOW}...${NC}` for warnings
  - `${BLUE}...${NC}` for info
- **Test with both git and non-git repos** where applicable

### Testing

Test scripts manually with:
1. ✅ Valid feature directory
2. ✅ Missing feature directory
3. ✅ Complete checklists
4. ✅ Incomplete checklists
5. ✅ Git repository
6. ✅ Non-git repository (if applicable)

---

## Architecture

```
.specify/
├── scripts/
│   └── bash/
│       ├── README.md                 (this file)
│       ├── common.sh                 (shared functions)
│       ├── check-prerequisites.sh    (prerequisite validation)
│       ├── implement-feature.sh      (implementation automation)
│       ├── create-new-feature.sh     (feature scaffolding)
│       ├── setup-plan.sh             (planning setup)
│       └── update-agent-context.sh   (agent context management)
```

## Workflow Integration

The scripts integrate with the Spec-Kit workflow:

```
1. /speckit.specify     → creates specs/NNN-feature-name/
2. /speckit.analyze     → creates research.md
3. /speckit.plan        → creates plan.md
4. /speckit.tasks       → creates tasks.md
5. ./implement-feature.sh → validates & prepares for implementation
6. [MANUAL/AGENT]       → execute tasks from tasks.md
7. /speckit.implement   → (alternative agent-driven implementation)
```

---

## Troubleshooting

### Script fails with "Feature directory not found"

Ensure you're on a feature branch (e.g., `001-feature-name`) or provide the feature directory path explicitly:

```bash
./implement-feature.sh specs/001-google-sheets-integration
```

### Script fails with "tasks.md not found"

Run `/speckit.tasks` first to generate the task list:

```bash
cd /path/to/repo
# Use GitHub Copilot or run task generation workflow
```

### Ignore files not being created

Ensure you have write permissions to the repository root directory and that the script is being run from within the repository.

### Checklist status shows incorrect counts

Verify that checklist items follow the format:
- `- [ ]` for incomplete items
- `- [x]` or `- [X]` for complete items
- Items must start with `- ` (dash + space)

---

## Contributing

When adding new scripts:
1. Follow existing patterns from `common.sh` and other scripts
2. Add documentation to this README
3. Test thoroughly before committing
4. Use meaningful commit messages

---

## License

Part of the Spec-Kit framework. See repository LICENSE for details.
