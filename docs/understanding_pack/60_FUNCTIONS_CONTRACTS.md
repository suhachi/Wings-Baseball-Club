# Functions Contracts

## ⚡ Entry Points (functions/src/index.ts)
```typescript
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export callables
export * from './callables/members';
export * from './callables/notices';
export * from './callables/tokens';
export * from './callables/events'; // μATOM-0531: createEventPost

// Export scheduled functions
export * from './scheduled/closeEventVotes'; // μATOM-0541: closeEventVotes


```

## 📋 Contracts
- **createNoticeWithPush**: Callable. Creates notice & sends FCM.
- **createEventPost**: Callable. Creates event & calculates vote close time.
- **closeEventVotes**: Scheduled. Closes votes & sends summary push.
- **registerFcmToken**: Callable. Registers device token.
