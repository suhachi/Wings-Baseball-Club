# 90. Full Source Dump: Root Config

## FILE: package.json
```json
{
  "name": "@figma/my-make-file",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "build:functions": "cd functions && npm run build",
    "dev": "vite",
    "export:code": "node scripts/export-code-to-md.mjs",
    "type-check": "tsc --noEmit",
    "test:rules": "jest tests/rules/firestore.rules.test.ts",
    "emulators:start": "firebase emulators:start --only firestore,auth",
    "emulators:start:all": "firebase emulators:start"
  },
  "dependencies": {
    "@emotion/react": "11.14.0",
    "@emotion/styled": "11.14.1",
    "@mui/icons-material": "7.3.5",
    "@mui/material": "7.3.5",
    "@popperjs/core": "2.11.8",
    "@radix-ui/react-accordion": "1.2.3",
    "@radix-ui/react-alert-dialog": "1.1.6",
    "@radix-ui/react-aspect-ratio": "1.1.2",
    "@radix-ui/react-avatar": "1.1.3",
    "@radix-ui/react-checkbox": "1.1.4",
    "@radix-ui/react-collapsible": "1.1.3",
    "@radix-ui/react-context-menu": "2.2.6",
    "@radix-ui/react-dialog": "1.1.6",
    "@radix-ui/react-dropdown-menu": "2.1.6",
    "@radix-ui/react-hover-card": "1.1.6",
    "@radix-ui/react-label": "2.1.2",
    "@radix-ui/react-menubar": "1.1.6",
    "@radix-ui/react-navigation-menu": "1.2.5",
    "@radix-ui/react-popover": "1.1.6",
    "@radix-ui/react-progress": "1.1.2",
    "@radix-ui/react-radio-group": "1.2.3",
    "@radix-ui/react-scroll-area": "1.2.3",
    "@radix-ui/react-select": "2.1.6",
    "@radix-ui/react-separator": "1.1.2",
    "@radix-ui/react-slider": "1.2.3",
    "@radix-ui/react-slot": "1.1.2",
    "@radix-ui/react-switch": "1.1.3",
    "@radix-ui/react-tabs": "1.1.3",
    "@radix-ui/react-toggle": "1.1.2",
    "@radix-ui/react-toggle-group": "1.1.2",
    "@radix-ui/react-tooltip": "1.1.8",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "cmdk": "1.1.1",
    "date-fns": "3.6.0",
    "embla-carousel-react": "8.6.0",
    "firebase": "^12.7.0",
    "input-otp": "1.4.2",
    "lucide-react": "0.487.0",
    "motion": "12.23.24",
    "next-themes": "0.4.6",
    "react": "18.3.1",
    "react-day-picker": "8.10.1",
    "react-dnd": "16.0.1",
    "react-dnd-html5-backend": "16.0.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.55.0",
    "react-popper": "2.3.0",
    "react-resizable-panels": "2.1.7",
    "react-responsive-masonry": "2.7.1",
    "react-slick": "0.31.0",
    "recharts": "2.15.2",
    "sonner": "2.0.3",
    "tailwind-merge": "3.2.0",
    "tw-animate-css": "1.3.8",
    "vaul": "1.1.2"
  },
  "devDependencies": {
    "@firebase/rules-unit-testing": "^5.0.0",
    "@tailwindcss/vite": "4.1.12",
    "@types/jest": "^29.5.14",
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "4.7.0",
    "firebase-admin": "^12.0.0",
    "firebase-tools": "^13.29.1",
    "jest": "^29.7.0",
    "tailwindcss": "4.1.12",
    "ts-jest": "^29.4.6",
    "typescript": "^5.2.2",
    "vite": "6.3.5"
  },
  "pnpm": {
    "overrides": {
      "vite": "6.3.5"
    }
  }
}

```

## FILE: tsconfig.json
```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": [
            "ES2020",
            "DOM",
            "DOM.Iterable"
        ],
        "module": "ESNext",
        "skipLibCheck": true,
        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": [
        "src"
    ],
    "references": [
        {
            "path": "./tsconfig.node.json"
        }
    ]
}
```

## FILE: vite.config.ts
```json
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
})

```

## FILE: firebase.json
```json
{
    "firestore": {
        "rules": "firestore.rules"
    },
    "functions": {
        "source": "functions",
        "runtime": "nodejs20"
    },
    "hosting": {
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    },
    "emulators": {
        "auth": {
            "port": 9099
        },
        "firestore": {
            "port": 8080
        },
        "functions": {
            "port": 5001
        },
        "ui": {
            "enabled": true,
            "port": 4000
        },
        "singleProjectMode": true
    }
}
```

## FILE: .firebaserc
```json
{
  "projects": {
    "default": "wings-baseball-club"
  }
}

```

## FILE: firestore.rules
```json
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // Helper Functions
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function memberPath(clubId, uid) {
      return /databases/$(database)/documents/clubs/$(clubId)/members/$(uid);
    }

    // 공통: isClubMember(clubId) 필수
    function isClubMember(clubId) {
      return isAuthenticated() && exists(memberPath(clubId, request.auth.uid));
    }

    function member(clubId) {
      return get(memberPath(clubId, request.auth.uid)).data;
    }

    function isActiveMember(clubId) {
      return isClubMember(clubId) && member(clubId).status == 'active';
    }

    function isAdminLike(clubId) {
      return isClubMember(clubId)
        && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
    }

    // ============================================
    // Default Deny
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }

    // ============================================
    // Global Collections
    // ============================================

    // Users (Global)
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // 운영 안전상: 유저 본인만 업데이트(역할/승인은 Functions/관리자화면에서 members 문서로)
      allow update: if isAuthenticated() && request.auth.uid == userId;
    }


    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated();
    }

    // ============================================
    // Club Collections
    // ============================================

    match /clubs/{clubId} {
      // 클럽 문서 read는 active member만 - μATOM-0551
      allow read: if isActiveMember(clubId);

      // ============================================
      // Members
      // ============================================
      match /members/{memberId} {
        allow read: if isAuthenticated();
        // 가입 직후 멤버 문서 생성 허용(단, role/status는 서버/관리자만 바꾸는 것을 권장)
        allow create: if isAuthenticated() && request.auth.uid == memberId;
        // 본인 프로필 일부 수정만 허용하고 싶으면 keys 제한을 추가해야 함(여기선 보수적으로 adminLike만 허용)
        allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdminLike(clubId));
      }

      // ============================================
      // Posts
      // ============================================
      match /posts/{postId} {
        // μATOM-0551: 읽기 isClubMember만
        allow read: if isActiveMember(clubId);

        // Posts Create Policy:
        // - notice/event: 클라 write 금지 (Functions-only) - μATOM-0552
        // - free: member create 허용 - μATOM-0553
        function isPostTypeAllowedForCreate() {
          let postType = request.resource.data.type;
          // notice, event는 Functions-only
          return postType == 'free';
        }

        allow create: if isActiveMember(clubId) && isPostTypeAllowedForCreate();

        // Posts Update/Delete Policy:
        // - author OR adminLike
        function isPostAuthor() {
          return resource.data.authorId == request.auth.uid;
        }

        function updatingProtectedPostFields() {
          return request.resource.data.keys().hasAny([
            'authorId','authorName','authorPhotoURL','type'
          ]);
        }

        // free: (author OR adminLike) update/delete - μATOM-0553
        allow update: if isActiveMember(clubId) && (
          isAdminLike(clubId)
          || (isPostAuthor() && !updatingProtectedPostFields())
        );

        allow delete: if isActiveMember(clubId) && (
          isAdminLike(clubId) || isPostAuthor()
        );

        // ============================================
        // Comments
        // ============================================
        // μATOM-0554: comments 정책
        // Comments Policy: create는 멤버, update/delete 작성자 또는 adminLike
        match /comments/{commentId} {
          allow read: if isActiveMember(clubId);
          allow create: if isActiveMember(clubId);

          allow update, delete: if isActiveMember(clubId) && (
            resource.data.authorId == request.auth.uid || isAdminLike(clubId)
          );
        }

        // ============================================
        // Attendance
        // ============================================
        // μATOM-0555: attendance 정책
        // Attendance Policy: 본인만 write + voteClosed==false 조건
        match /attendance/{userId} {
          allow read: if isActiveMember(clubId);
          // 본인만, voteClosed==false일 때만 write 허용
          function isVoteOpen() {
            let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
            return post.voteClosed != true;
          }
          allow write: if isActiveMember(clubId) 
            && request.auth.uid == userId
            && isVoteOpen();
        }

      }

      // ============================================
      // FCM Tokens
      // ============================================
      // μATOM-0556: tokens/audit/idempotency 클라 write 금지
      match /members/{memberId}/tokens/{tokenId} {
        allow read: if false; // 클라 read 금지
        allow write: if false; // 클라 write 금지 (토큰 등록은 callable만)
      }

      // ============================================
      // Audit / Idempotency
      // ============================================
      // μATOM-0556: 일반회원 접근 차단 (Functions-only)
      match /audit/{docId} {
        allow read, write: if false;
      }

      match /idempotency/{docId} {
        allow read, write: if false;
      }
    }
  }
}

```

