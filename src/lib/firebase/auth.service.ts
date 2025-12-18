// Firebase Authentication Service
import {
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';


import { auth, db } from './config';
import type { UserDoc, UserRole } from './types';


/**
 * [POLICY] Google OAuth Only Login
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google Login Error:', error);
    throw error;
  }
}

/**
 * [POLICY] Simplified Account Creation
 * New users are created as 'pending'.
 */
export async function createAccount(
  user: FirebaseUser,
  realName: string,
  nickname?: string,
  phone?: string
): Promise<UserDoc> {
  try {
    const role: UserRole = 'MEMBER';
    const clubId = 'WINGS'; // Default club

    const userData: UserDoc = {
      uid: user.uid,
      realName,
      nickname: nickname || user.displayName || '',
      phone: phone || null,
      photoURL: user.photoURL || null,
      role: role,
      status: 'pending', // POLICY: Must be manually approved/activated by admin
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1. Write to global users collection (Profile)
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Add to Club Members collection (Membership)
    await setDoc(doc(db, 'clubs', clubId, 'members', user.uid), {
      ...userData,
      clubId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userData;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

/**
 * Check if user document exists
 */
export async function checkUserExists(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

/**
 * Get current user data with KST dates
 */
export async function getCurrentUserData(uid: string): Promise<UserDoc | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data() as UserDoc;

    // [TEMP] Auto-Promote dev email to ADMIN
    const rawData = data as any;
    if (rawData.email === 'jsbae59@gmail.com' && data.role !== 'ADMIN') {
      await updateDoc(userRef, { role: 'ADMIN', status: 'active' });
      const memberRef = doc(db, 'clubs', 'WINGS', 'members', uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        await updateDoc(memberRef, { role: 'ADMIN', status: 'active' });
      }
      data.role = 'ADMIN';
      data.status = 'active';
    }

    return {
      ...data,
      createdAt: (data.createdAt as any)?.toDate?.() || new Date(),
      updatedAt: (data.updatedAt as any)?.toDate?.() || new Date(),
    } as UserDoc;
  } catch (error: any) {
    if (error.code === 'unavailable') return null;
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserData(
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    const sanitizedUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);

    await setDoc(
      userRef,
      {
        ...sanitizedUpdates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Auth state listener
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// --------------------------------------------------------------------------------------------------------------------
// RBAC HELPERS
// --------------------------------------------------------------------------------------------------------------------

export function isAdmin(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN', 'TREASURER'].includes(role);
}

export function isTreasury(role: UserRole): boolean {
  return ['PRESIDENT', 'TREASURER'].includes(role);
}
