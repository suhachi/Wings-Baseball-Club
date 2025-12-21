# C03: Comment Data Model Schema

**Status**: Consistent across Service, Context, and Rules.

## 1. Schema Definition

**Path**: `clubs/{clubId}/posts/{postId}/comments/{commentId}`

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Document ID (Client-side view model includes this) |
| `postId` | string | Yes | Parent Post ID (Stored redundant for ease of indexing/querying groups if needed) |
| `content` | string | Yes | Comment text content |
| `authorId` | string | Yes | Creator's UID |
| `authorName` | string | Yes | Creator's Real Name (Snapshot) |
| `authorPhotoURL` | string | No | Creator's Profile Photo URL (Snapshot) |
| `createdAt` | Timestamp | Yes | Server Timestamp |
| `updatedAt` | Timestamp | Yes | Server Timestamp |

## 2. Source of Truth

- **Types**: `src/lib/firebase/types.ts` (`CommentDoc`)
- **Service**: `src/lib/firebase/firestore.service.ts` (`addComment`, `getComments`)
- **Context**: `src/app/contexts/DataContext.tsx` (`Comment` interface maps flat fields to nested `author` object for UI)
- **Rules**: `firestore.rules` (Enforces `authorId` match)

## 3. UI Representation (`DataContext`)

```typescript
export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: { // Mapped from authorId, authorName, authorPhotoURL
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. Discrepancies
- None found. Service implementation correctly adds `postId` to the document. Rules correctly police `authorId`.
