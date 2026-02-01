#!/usr/bin/env bash

# Feature Implementation Automation Script
#
# This script automates the execution of feature implementation following the spec-kit workflow:
# 1. Parse tasks.md structure
# 2. Check checklists status (validate all completed)
# 3. Load and analyze implementation context
# 4. Verify project setup (ignore files)
# 5. Execute implementation following task plan
# 6. Track progress and handle errors
# 7. Validate completion
#
# Usage: ./implement-feature.sh [FEATURE_DIR]
#
# FEATURE_DIR: Path to the feature specification directory (e.g., specs/001-google-sheets-integration)
#              If not provided, uses current branch to determine feature directory
#
# Example:
#   ./implement-feature.sh specs/001-google-sheets-integration

set -e

# Show help message
show_help() {
    cat << 'EOF'
Usage: implement-feature.sh [FEATURE_DIR]

Feature Implementation Automation Script

This script automates the execution of feature implementation following the spec-kit workflow:
1. Parse tasks.md structure
2. Check checklists status (validate all completed)
3. Load and analyze implementation context
4. Verify project setup (ignore files)
5. Provide next steps for manual implementation

ARGUMENTS:
  FEATURE_DIR    Path to feature specification directory (e.g., specs/001-google-sheets-integration)
                 If not provided, uses current branch to determine feature directory

OPTIONS:
  --help, -h     Show this help message

EXAMPLES:
  # Run with explicit feature directory
  ./implement-feature.sh specs/001-google-sheets-integration

  # Run using current branch to determine feature directory
  ./implement-feature.sh

EXIT CODES:
  0    Success - all prerequisites validated
  1    Error - missing files, invalid directory, etc.

WORKFLOW STEPS:
  ✅ Step 1: Parse tasks.md structure
  ✅ Step 2: Check checklists status with completion table
  ✅ Step 3: Load and analyze implementation context
  ✅ Step 4: Verify project setup (create/update ignore files)
  ℹ️  Steps 5-9: Manual implementation following tasks.md plan

For more information, see .specify/scripts/bash/README.md
EOF
    exit 0
}

# Parse arguments
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    show_help
fi

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Source common functions
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Feature directory can be passed as argument or derived from current branch
if [[ -n "${1:-}" ]]; then
    FEATURE_DIR="$1"
    # Make path absolute
    if [[ ! "$FEATURE_DIR" = /* ]]; then
        FEATURE_DIR="$(pwd)/$FEATURE_DIR"
    fi
else
    # Get feature directory from current branch
    eval $(get_feature_paths)
fi

# Validate feature directory exists
if [[ ! -d "$FEATURE_DIR" ]]; then
    log_error "Feature directory not found: $FEATURE_DIR"
    log_error "Please provide a valid feature directory path."
    exit 1
fi

log_info "Feature directory: $FEATURE_DIR"

# ============================================================================
# STEP 1: Parse tasks.md
# ============================================================================

TASKS_FILE="$FEATURE_DIR/tasks.md"

if [[ ! -f "$TASKS_FILE" ]]; then
    log_error "tasks.md not found in $FEATURE_DIR"
    log_error "Please run /speckit.tasks first to generate the task list."
    exit 1
fi

log_success "Found tasks.md"

# ============================================================================
# STEP 2: Check checklists status
# ============================================================================

CHECKLISTS_DIR="$FEATURE_DIR/checklists"

check_checklists() {
    if [[ ! -d "$CHECKLISTS_DIR" ]]; then
        log_info "No checklists directory found, skipping checklist validation"
        return 0
    fi

    log_info "Checking checklist status..."

    local checklist_files=()
    local all_complete=true
    
    # Find all markdown files in checklists directory
    while IFS= read -r -d '' file; do
        checklist_files+=("$file")
    done < <(find "$CHECKLISTS_DIR" -name "*.md" -type f -print0 2>/dev/null)

    if [[ ${#checklist_files[@]} -eq 0 ]]; then
        log_info "No checklist files found, skipping validation"
        return 0
    fi

    # Print table header
    echo ""
    printf "| %-20s | %-5s | %-9s | %-10s | %-6s |\n" "Checklist" "Total" "Completed" "Incomplete" "Status"
    printf "|%s|%s|%s|%s|%s|\n" "----------------------" "-------" "-----------" "------------" "--------"

    # Process each checklist
    for file in "${checklist_files[@]}"; do
        local filename=$(basename "$file")
        local total=0
        local completed=0
        local incomplete=0

        # Count total items: - [ ], - [X], - [x]
        total=$(grep -E '^\s*-\s+\[([ Xx])\]' "$file" | wc -l || echo 0)

        # Count completed items: - [X], - [x]
        completed=$(grep -E '^\s*-\s+\[[Xx]\]' "$file" | wc -l || echo 0)

        # Calculate incomplete items
        incomplete=$((total - completed))

        # Determine status
        local status="✓ PASS"
        if [[ $incomplete -gt 0 ]]; then
            status="✗ FAIL"
            all_complete=false
        fi

        # Print row
        printf "| %-20s | %-5d | %-9d | %-10d | %-6s |\n" "$filename" "$total" "$completed" "$incomplete" "$status"
    done

    echo ""

    # Return status
    if [[ "$all_complete" == "true" ]]; then
        log_success "All checklists complete!"
        return 0
    else
        log_warning "Some checklists are incomplete."
        return 1
    fi
}

# Check checklists and prompt user if incomplete
if ! check_checklists; then
    echo ""
    read -p "Some checklists are incomplete. Proceed anyway? (yes/no): " answer
    case "${answer,,}" in  # Convert to lowercase
        yes|y|proceed|continue)
            log_info "Proceeding with implementation despite incomplete checklists..."
            ;;
        *)
            log_info "Implementation halted. Please complete checklists before proceeding."
            exit 0
            ;;
    esac
fi

# ============================================================================
# STEP 3: Load and analyze implementation context
# ============================================================================

log_info "Loading implementation context..."

# Required files
PLAN_FILE="$FEATURE_DIR/plan.md"
if [[ ! -f "$PLAN_FILE" ]]; then
    log_error "plan.md not found. Please run /speckit.plan first."
    exit 1
fi
log_success "Found plan.md"

if [[ ! -f "$TASKS_FILE" ]]; then
    log_error "tasks.md not found. Please run /speckit.tasks first."
    exit 1
fi
log_success "Found tasks.md"

# Optional files
DATA_MODEL_FILE="$FEATURE_DIR/data-model.md"
[[ -f "$DATA_MODEL_FILE" ]] && log_success "Found data-model.md" || log_info "data-model.md not found (optional)"

CONTRACTS_DIR="$FEATURE_DIR/contracts"
if [[ -d "$CONTRACTS_DIR" ]] && [[ -n "$(ls -A "$CONTRACTS_DIR" 2>/dev/null)" ]]; then
    log_success "Found contracts/ directory"
else
    log_info "contracts/ directory not found or empty (optional)"
fi

RESEARCH_FILE="$FEATURE_DIR/research.md"
[[ -f "$RESEARCH_FILE" ]] && log_success "Found research.md" || log_info "research.md not found (optional)"

QUICKSTART_FILE="$FEATURE_DIR/quickstart.md"
[[ -f "$QUICKSTART_FILE" ]] && log_success "Found quickstart.md" || log_info "quickstart.md not found (optional)"

# ============================================================================
# STEP 4: Project Setup Verification (Ignore Files)
# ============================================================================

log_info "Verifying project setup and ignore files..."

REPO_ROOT=$(get_repo_root)

# Function to check and create/update ignore file

# Function to check and create/update ignore file
verify_ignore_file() {
    local ignore_file="$1"
    shift
    local patterns=("$@")
    
    local filename=$(basename "$ignore_file")
    
    if [[ -f "$ignore_file" ]]; then
        log_info "Checking $filename..."
        local missing_patterns=()
        
        for pattern in "${patterns[@]}"; do
            # Check for exact match or similar patterns (e.g., "node_modules" matches "node_modules/")
            local pattern_base="${pattern%/}"
            # For patterns starting with !, skip regex check and just check if exists
            if [[ "$pattern" == !* ]]; then
                if ! grep -qF "$pattern" "$ignore_file"; then
                    missing_patterns+=("$pattern")
                fi
            else
                # Escape special regex characters for grep
                local escaped_pattern=$(printf '%s\n' "$pattern_base" | sed 's/[.[*^$\\]/\\&/g')
                if ! grep -qE "^${escaped_pattern}/?$" "$ignore_file" && ! grep -qF "$pattern" "$ignore_file"; then
                    missing_patterns+=("$pattern")
                fi
            fi
        done
        
        if [[ ${#missing_patterns[@]} -gt 0 ]]; then
            log_warning "Adding ${#missing_patterns[@]} missing pattern(s) to $filename"
            # Ensure file ends with newline before appending
            [[ -n $(tail -c1 "$ignore_file" 2>/dev/null) ]] && echo "" >> "$ignore_file"
            for pattern in "${missing_patterns[@]}"; do
                echo "$pattern" >> "$ignore_file"
            done
            log_success "Updated $filename"
        else
            log_success "$filename is up to date"
        fi
    else
        log_info "Creating $filename..."
        {
            echo "# Auto-generated ignore file"
            printf '%s\n' "${patterns[@]}"
        } > "$ignore_file"
        log_success "Created $filename"
    fi
}

# Check if git repository
if git rev-parse --git-dir >/dev/null 2>&1; then
    log_info "Git repository detected"
    
    # Verify .gitignore - only add truly missing patterns
    gitignore_patterns=(
        "build/"
        ".env*"
        "!.env.example"
        "!.env.local.example"
        "Thumbs.db"
        "*.tmp"
        "coverage/"
    )
    verify_ignore_file "$REPO_ROOT/.gitignore" "${gitignore_patterns[@]}"
fi

# Check for Dockerfile (Docker)
if [[ -f "$REPO_ROOT/Dockerfile" ]] || grep -q "Docker" "$PLAN_FILE" 2>/dev/null; then
    log_info "Docker detected"
    dockerignore_patterns=(
        "node_modules/"
        ".git/"
        "Dockerfile*"
        ".dockerignore"
        "*.log*"
        ".env*"
        "coverage/"
        "dist/"
        "build/"
    )
    verify_ignore_file "$REPO_ROOT/.dockerignore" "${dockerignore_patterns[@]}"
fi

# Check for ESLint
if [[ -f "$REPO_ROOT/.eslintrc"* ]] || [[ -f "$REPO_ROOT/eslint.config"* ]]; then
    log_info "ESLint detected"
    
    if [[ -f "$REPO_ROOT/eslint.config"* ]]; then
        log_info "Modern ESLint config detected (eslint.config.*), verify 'ignores' entries manually"
    else
        eslintignore_patterns=(
            "node_modules/"
            "dist/"
            "build/"
            "coverage/"
            "*.min.js"
        )
        verify_ignore_file "$REPO_ROOT/.eslintignore" "${eslintignore_patterns[@]}"
    fi
fi

# Check for Prettier
if [[ -f "$REPO_ROOT/.prettierrc"* ]]; then
    log_info "Prettier detected"
    prettierignore_patterns=(
        "node_modules/"
        "dist/"
        "build/"
        "coverage/"
        "package-lock.json"
        "yarn.lock"
        "pnpm-lock.yaml"
    )
    verify_ignore_file "$REPO_ROOT/.prettierignore" "${prettierignore_patterns[@]}"
fi

# ============================================================================
# STEP 5-9: Task Execution (Manual Step - Agent Required)
# ============================================================================

echo ""
log_info "============================================================================"
log_info "Prerequisites Complete!"
log_info "============================================================================"
echo ""
log_info "The following files are ready for implementation:"
log_info "  - Tasks: $TASKS_FILE"
log_info "  - Plan: $PLAN_FILE"
[[ -f "$DATA_MODEL_FILE" ]] && log_info "  - Data Model: $DATA_MODEL_FILE"
[[ -d "$CONTRACTS_DIR" ]] && log_info "  - Contracts: $CONTRACTS_DIR"
[[ -f "$RESEARCH_FILE" ]] && log_info "  - Research: $RESEARCH_FILE"
[[ -f "$QUICKSTART_FILE" ]] && log_info "  - Quickstart: $QUICKSTART_FILE"
echo ""
log_info "Next steps:"
log_info "  1. Review the task list in tasks.md"
log_info "  2. Begin implementation following the phase-by-phase plan"
log_info "  3. Mark tasks as complete [X] in tasks.md as you progress"
log_info "  4. Respect task dependencies and parallel execution markers [P]"
log_info "  5. Follow TDD approach: write tests before implementation"
log_info "  6. Validate each phase before proceeding to the next"
echo ""
log_success "Ready to begin implementation! 🚀"
echo ""
log_info "Note: Task execution (Steps 5-9) requires manual implementation or agent"
log_info "      assistance. This script has verified all prerequisites and project setup."
echo ""

exit 0
