# Guidelines

This document defines the project's rules, objectives, and progress management methods. Please proceed with the project according to the following content.

## Top-Level Rules

* To maximize efficiency, if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially.
* You must think exclusively in English. However, you are required to respond in Japanese.

## Project Rules

* Follow the rules below for writing code comments and documentation:
   * Code comments that describe the background or reasoning behind the implementation should be written in Japanese.
   * Do not use emojis.
* When writing Japanese, do not include unnecessary spaces.
   * for example
      * ◯ "Claude Code入門"
      * × "Claude Code 入門"
* To understand how to use a library, always use the Context7 MCP to retrieve the latest information.
* When searching for hidden folders like `docs`, the `List` tool is unlikely to find them. Use the `Bash` tool to find hidden folders.
* You must send a notification upon task completion.
   * "Task completion" refers to the state immediately after you have finished responding to the user and are awaiting their next input.
   * A notification is required even for minor tasks like format correction, refactoring, or documentation updates.
   * Use the following format and `osascript` to send notifications:
      * `osascript -e 'display notification "${TASK_DESCRIPTION} is complete" with title "${REPOSITORY_NAME}"'`
      * `${TASK_DESCRIPTION}` should be a summary of the task, and `${REPOSITORY_NAME}` should be the repository name.

## Project Objectives

### Development Style

* Requirements and design for each task must be documented in `docs/design.md`.
* Detailed sub-tasks for each main task must be defined in `docs/task.md`.
* You must update `docs/task.md` as you make progress on your work.

1. First, create a plan and document the requirements in `docs/design.md`.
2. Based on the requirements, identify all necessary tasks and list them in a Markdown file at `docs/task.md`.
3. Once the plan is established, create a new branch and begin your work.
   * Branch names should start with `feature/` followed by a brief summary of the task.
4. Break down tasks into small, manageable units that can be completed within a single commit.
5. Create a checklist for each task to manage its progress.
6. Always apply a code formatter to maintain readability.
7. Do not commit your changes. Instead, ask for confirmation.
8. Since npm run dev is basically always being monitored by the user, when verifying operation by running npm run dev, only check if the build passes and do not actually run npm run dev.