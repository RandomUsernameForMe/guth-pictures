---
description: Prep a brand photo shoot end-to-end — research client, design concepts, build moodboard + pose board, assemble Canva presentation.
argument-hint: <name> | <linkedin-url> | <website>
---

Invoke the **brand-shoot-prep** skill to run the full prep workflow for a client.

Raw input (any of name / LinkedIn / website, separated by `|` or newlines):

$ARGUMENTS

Follow the phases in `.claude/skills/brand-shoot-prep/SKILL.md` in order. If any of
name / LinkedIn / website is missing, ask for it before scaffolding. Otherwise proceed
autonomously, pausing only at the two decision points the skill defines (which concept(s)
to board, and confirm before exporting the Canva deck).
