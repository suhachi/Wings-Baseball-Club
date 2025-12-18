# firestore.rules 원문

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)).data.role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
    }

    // Default: Deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Users (Global Profile)
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }

    // Invite Codes (Global)
    // FIX: Allow unauthenticated read to verify code
    // FIX: Allow unauthenticated create for specific fallback code (WINGS2024)
    match /inviteCodes/{code} {
      allow read: if true; 
      // Safe-ish: only allow if creating the specific emergency code OR if Admin
      allow create: if code == 'WINGS2024' || isAdmin(); 
      allow update: if isAuthenticated(); // Mark as used
      allow delete: if isAdmin();
    }

    // Clubs Collection
    match /clubs/{clubId} {
      allow read: if true;
      
      // Members Subcollection
      match /members/{memberId} {
        allow read: if isAuthenticated();
        // Allow user to create their own member doc during signup
        allow create: if isAuthenticated() && request.auth.uid == memberId;
        allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdmin());
      }
      
      // Posts
      match /posts/{postId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
        allow delete: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());


        // Attendance (Subcollection)
        match /attendance/{docId} {
            allow read: if isAuthenticated();
            allow write: if isAuthenticated();
        }
        
        // Comments (Subcollection)
        match /comments/{commentId} {
            allow read: if isAuthenticated();
            allow create: if isAuthenticated();
            allow update: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
            allow delete: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
        }

        // Game Records (Lineup, Batting, Pitching)
        // Helper to check if user can record: (Admin OR in recorders) AND !recordingLocked
        function canRecord() {
           let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
           let isRecorder = request.auth.uid in (post.recorders != null ? post.recorders : []);
           let isLocked = post.recordingLocked == true;
           return (isAdmin() || isRecorder) && !isLocked;
        }

        // Locked Override: Admin can always write (Policy A)
        function canRecordAdminOverride() {
           let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
           let isRecorder = request.auth.uid in (post.recorders != null ? post.recorders : []);
           let isLocked = post.recordingLocked == true;
           
           // Recorders blocked if locked. Admin always allowed.
           return isAdmin() || (isRecorder && !isLocked); 
        }

        match /record_lineup/{docId} {
          allow read: if isAuthenticated(); // Members can view
          allow write: if isAuthenticated() && canRecordAdminOverride();
        }

        match /record_batting/{docId} {
          allow read: if isAuthenticated();
          allow write: if isAuthenticated() && canRecordAdminOverride();
        }

        match /record_pitching/{docId} {
          allow read: if isAuthenticated();
          allow write: if isAuthenticated() && canRecordAdminOverride();
        }
      }

       // Notices
      match /notices/{noticeId} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    // Notifications (Global)
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated(); // Allow creating notifications (e.g. by other users/actions)
      // Ideally restrict write to "system" or specific triggers, but for now allow auth users (p2p notifications)
    }
  }
}
```

