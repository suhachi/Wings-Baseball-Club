# src/app/contexts/AuthContext.tsx - 권한 체크 함수 원문

```typescript
// ... imports ...

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... state ...

  const isAdmin = () => {
    return user ? checkIsAdmin(user.role) : false;
  };

  const isTreasury = () => {
    return user ? checkIsTreasury(user.role) : false;
  };

  const isRecorder = (_postId: string) => {
    return user ? canRecordGame(user.role) : false;
  };

  // ... provider ...
};

// auth.service.ts에서 정의된 권한 함수들
export function isAdmin(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN', 'TREASURER'].includes(role);
}

export function isTreasury(role: UserRole): boolean {
  return ['PRESIDENT', 'TREASURER'].includes(role);
}

export function canManageMembers(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function canDeletePosts(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function canManageFinance(role: UserRole): boolean {
  return ['PRESIDENT', 'TREASURER'].includes(role);
}

export function canRecordGame(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function canCreatePosts(role: UserRole): boolean {
  return true; // 모든 회원 가능
}
```

