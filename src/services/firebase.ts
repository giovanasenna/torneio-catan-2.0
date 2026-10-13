import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Match } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const MATCHES_COLLECTION = 'matches';

/**
 * Real-time listener for matches stored in Cloud Firestore.
 * Automatically pushes new/updated matches to all connected devices.
 */
export function subscribeToMatches(
  onUpdate: (matches: Match[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches: Match[] = [];
        snapshot.forEach((docSnap) => {
          matches.push(docSnap.data() as Match);
        });
        onUpdate(matches);
      },
      (error) => {
        console.warn('Firestore onSnapshot subscription error:', error);
        onError?.(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to Firestore matches:', err);
    onError?.(err);
    return () => {};
  }
}

/**
 * Fetch matches directly from Cloud Firestore (single fetch).
 */
export async function getMatchesFromFirestore(): Promise<Match[]> {
  try {
    const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const matches: Match[] = [];
    snapshot.forEach((docSnap) => {
      matches.push(docSnap.data() as Match);
    });
    return matches;
  } catch (err) {
    console.error('Error fetching matches from Firestore:', err);
    throw err;
  }
}

/**
 * Save or update a match in Cloud Firestore.
 * This instantly syncs to all friends' devices.
 */
export async function saveMatchToFirestore(match: Match): Promise<void> {
  try {
    const docRef = doc(db, MATCHES_COLLECTION, match.id);
    await setDoc(docRef, match, { merge: true });
  } catch (err) {
    console.error(`Error saving match ${match.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Delete a match from Cloud Firestore.
 */
export async function deleteMatchFromFirestore(matchId: string): Promise<void> {
  try {
    const docRef = doc(db, MATCHES_COLLECTION, matchId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting match ${matchId} from Firestore:`, err);
    throw err;
  }
}

/**
 * Bulk sync a list of matches into Cloud Firestore (e.g., local backup restore or recovery).
 */
export async function syncMatchesToFirestore(matches: Match[]): Promise<number> {
  let synced = 0;
  for (const m of matches) {
    try {
      await saveMatchToFirestore(m);
      synced++;
    } catch (err) {
      console.warn(`Failed to sync match ${m.id}:`, err);
    }
  }
  return synced;
}

/**
 * Test connectivity to Cloud Firestore.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    // If it's a permission or not-found error, the connection is still alive
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore client is offline.');
      return false;
    }
    return true;
  }
}
