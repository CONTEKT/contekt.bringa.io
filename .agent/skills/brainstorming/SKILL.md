---
name: brainstorming
description: Exploratory design tool. Use whenever you need to design a feature, understand requirements, or explore ideas before coding.
---

# Brainstorming Ideas Into Designs

## When to use this skill
- You need to design a new feature
- You need to understand user requirements
- You are exploring different approaches to a problem
- You want to turn a vague idea into a concrete spec

## Workflow
1.  **Understand Context:** Read relevant files and documentation.
2.  **Clarify:** Ask questions one at a time to refine the idea.
3.  **Explore:** Propose 2-3 approaches with trade-offs.
4.  **Design:** Present the design in small sections (200-300 words).
5.  **Validate:** check after each section.
6.  **Document:** Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`.

## Instructions

### 1. Understanding the Idea
*   **Context First:** Always check the current project state (files, docs, recent commits) before asking.
*   **One Question Rule:** Ask only ONE question per message.
*   **Multiple Choice:** Prefer providing options (A, B, C) over open-ended questions.
*   **Focus:** Nail down purpose, constraints, and success criteria.

### 2. Exploring Approaches
*   **Rule of Three:** Always propose 2-3 different approaches.
*   **Trade-offs:** explicitly state pros/cons for each.
*   **Recommendation:** State your preferred approach and why.

### 3. Presenting the Design
*   **Incremental:** Break design into 200-300 word chunks.
*   **Checkpoints:** Ask "Does this look right so far?" after each chunk.
*   **Coverage:** Architecture, components, data flow, error handling, testing.

### 4. Post-Design
*   **Save:** Write to `docs/plans/YYYY-MM-DD-<topic>-design.md`.
*   **Handoff:** Ask "Ready to set up for implementation?".
*   **Next Steps:** Suggest using `planning` skill to create an implementation plan.

## Resources
[None]