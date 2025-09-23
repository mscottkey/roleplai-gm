
'use server';

import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getServerApp } from '@/app/actions';

export type UserPreferences = {
  displayName?: string;
  defaultGender?: string;
};

export async function updateUserPreferences(userId: string, prefs: UserPreferences): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, prefs, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserPreferences action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message };
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) {
    return null;
  }

  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error in getUserPreferences action:', error);
    return null;
  }
}
