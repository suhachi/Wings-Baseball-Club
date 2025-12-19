# Architecture Overview

## 🏗️ App Structure
- **Entry Point**: `src/main.tsx` -> `src/app/App.tsx`
- **Routing**: State-based routing (Custom)
- **State Management**: React Context (`AuthContext`, `DataContext`, `ClubContext`)

## 📱 Pages (src/app/pages)
- AccessDeniedPage.tsx
- AdminPage.tsx
- AdminPage.tsx_append
- BoardsPage.tsx
- HomePage.tsx
- InstallPage.tsx
- LoginPage.tsx
- MyActivityPage.tsx
- MyPage.tsx
- NotificationPage.tsx
- SettingsPage.tsx

## 🔐 Auth Flow
- **Provider**: Firebase Auth (Google Only)
- **Access Gate**: `AuthContext` checks `members/{uid}` status ('active')
- **Role Based Access**: `isAdmin()`, `isTreasury()` helpers

## 🧩 Key Components
- **Layout**: `BottomNav`, `TopBar`
- **Modals**: `CreatePostModal`, `PostDetailModal`
