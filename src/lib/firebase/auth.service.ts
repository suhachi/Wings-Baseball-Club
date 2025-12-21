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
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { isAdminRole } from '../../app/lib/auth/roles';


import { auth, db } from './config';
import type { UserDoc, UserRole } from './types';


// --------------------------------------------------------------------------------------------------------------------
// NEW AUTH METHODS (Email/Password)
// --------------------------------------------------------------------------------------------------------------------

export interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  clubId: string;
}

export async function signUpWithEmailPassword(params: SignupParams): Promise<UserDoc> {
  const { email, password, name, phone, clubId } = params;

  // 1. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Update Profile
  await updateProfile(user, { displayName: name });

  // 3. Create Firestore Documents (Global User + Club Member)
  // [POLICY] Auto-activate for email signups (No approval needed)
  const now = serverTimestamp();

  const userData: UserDoc = {
    uid: user.uid,
    email: user.email || email,
    realName: name,
    nickname: name, // Default nickname to realName
    phone: phone,
    photoURL: user.photoURL || null,
    role: 'MEMBER',
    status: 'active', // IMMEDIATE ACTIVATION
    backNumber: null, // [M00-FIX] Init backNumber
    createdAt: new Date(), // Type compatibility, will be overwritten by serverTimestamp
    updatedAt: new Date(),
  };

  // Global User
  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    createdAt: now,
    updatedAt: now,
  });

  // Club Member
  await setDoc(doc(db, 'clubs', clubId, 'members', user.uid), {
    ...userData,
    clubId, // Add clubId to member doc
    createdAt: now,
    updatedAt: now,
  });

  return userData;
}

export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// --------------------------------------------------------------------------------------------------------------------
// LEGACY / SHARED METHODS
// --------------------------------------------------------------------------------------------------------------------

/**
 * [POLICY] Google OAuth Only Login -> Legacy Grace (Hidden Link) handling remains in UI
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  // ... existing code ...

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
 * [POLICY] Simplified Account Creation / Profile Completion
 * New users are created as 'active' (GateMode SOFT) but with 'MEMBER' role.
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
      email: user.email || '',
      realName,
      nickname: nickname || user.displayName || '',
      phone: phone || '',
      photoURL: user.photoURL || null,
      role: role,
      status: 'active', // POLICY: Always active on creation (GateMode SOFT handles permissions)
      backNumber: null, // [M00-FIX] Init backNumber for SSoT
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
 * Check if user profile (global) exists
 */
export async function checkUserExists(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

/**
 * Check if membership (club-specific) exists
 */
export async function checkMemberExists(clubId: string, uid: string): Promise<boolean> {
  const memberRef = doc(db, 'clubs', clubId, 'members', uid);
  const memberSnap = await getDoc(memberRef);
  return memberSnap.exists();
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
/**
 * Update member profile (SSoT) + Global sync
 */
export async function updateMemberData(
  clubId: string,
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  try {
    const memberRef = doc(db, 'clubs', clubId, 'members', uid);
    const userRef = doc(db, 'users', uid);

    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    const sanitizedUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);

    const timestampedUpdates = {
      ...sanitizedUpdates,
      updatedAt: serverTimestamp(),
    };

    // 1. Update Member Doc (Primary SSoT)
    await setDoc(memberRef, timestampedUpdates, { merge: true });

    // 2. Sync to Global User Doc (Legacy/Global View)
    // [POLICY] Sync only if User Doc exists. Never create orphan user docs from member updates.
    // [POLICY] Strip role/status/clubId to avoid SSoT corruption.
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const globalUpdates = { ...timestampedUpdates };
      delete globalUpdates.role;
      delete globalUpdates.status;
      delete globalUpdates.clubId;

      await setDoc(userRef, globalUpdates, { merge: true });
      console.log(`[updateMemberData] Updated member & synced user doc for ${uid}`);
    } else {
      console.log(`[updateMemberData] Updated member only. Global user doc missing for ${uid}, skipping sync.`);
    }

  } catch (error) {
    console.error('Error updating member data:', error);
    throw error;
  }
}

/**
 * Legacy Global Update (Deprecated for Profile Edit, kept for compatibility)
 */
export async function updateUserData(
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  // Redirect to default club member update if possible, but we don't know clubId here easily without param.
  // For now, we will mark this as "Global Only" but usually we want SSoT.
  // However, the prompt asks to "Find updateUserData/updateUser ... and replace/modify".
  // I will simply replace usages in AuthContext.

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

/**
 * [POLICY] Auto-provision member document if missing (Gate-Level)
 * Ensures user has a member document so they are not blocked by Access Gate.
 */
export async function ensureMemberExists(clubId: string, user: FirebaseUser): Promise<void> {
  const memberRef = doc(db, 'clubs', clubId, 'members', user.uid);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    console.log(`[Auto-Provision] Creating member doc for ${user.uid}`);
    const now = serverTimestamp();

    // Try to get global profile for details
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    await setDoc(memberRef, {
      uid: user.uid,
      email: user.email || userData?.email || '',
      realName: userData?.realName || user.displayName || '이름 없음',
      nickname: userData?.nickname || user.displayName || '닉네임',
      phone: userData?.phone || '',
      photoURL: user.photoURL || userData?.photoURL || null,
      role: 'MEMBER',
      status: 'active', // Auto-activated
      backNumber: null, // [M00-FIX] Init backNumber
      clubId,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// --------------------------------------------------------------------------------------------------------------------
// RBAC HELPERS
// --------------------------------------------------------------------------------------------------------------------

export function isAdmin(role: string): boolean {
  return isAdminRole(role);
}

export function isTreasury(role: UserRole): boolean {
  // Finance requires specific trust, but typically Admins can oversee.
  // For now, keeping specific to President/Treasurer + Admin for backup.
  return ['PRESIDENT', 'TREASURER', 'ADMIN'].includes(role);
}
