# Task: T2-add-delete-journal-api

## Status

pending

## Objective

Add an API endpoint to delete a journal entry by id.

## Context Pack

context-packs/divya-runner-v1.md

## Scope

- Add DELETE /api/journal/:id
- Remove entry from database using Prisma
- Return success response

## Out of Scope

- No UI changes
- No soft delete
- No auth

## Acceptance Criteria

- DELETE endpoint exists
- Valid id deletes entry
- Invalid id returns 404
- Response is JSON

## Verification

```bash
curl -X DELETE http://localhost:5173/api/journal/<id>
```
