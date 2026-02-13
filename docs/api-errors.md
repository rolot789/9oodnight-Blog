# API Error Codes

All API routes use this envelope:

```json
{ "ok": true, "data": ... }
```

or

```json
{ "ok": false, "error": { "code": "CODE", "message": "..." } }
```

## Shared
- `UNAUTHORIZED`: Authentication required.
- `INVALID_INPUT`: Invalid client input.

## Search (`/api/search`)
- `BAD_MODE`: Unsupported `mode` query value.
- `SEARCH_FAILED`: Search processing failed.

## Todos (`/api/todos`, `/api/todos/[id]`)
- `TODO_LIST_FAILED`: Failed to fetch todo list.
- `TODO_CREATE_FAILED`: Failed to create todo.
- `TODO_UPDATE_FAILED`: Failed to update todo.
- `TODO_DELETE_FAILED`: Failed to delete todo.

## Auth (`/api/auth/*`)
- `SESSION_FETCH_FAILED`: Failed to fetch current session/user.
- `SIGNOUT_FAILED`: Failed to sign out.
