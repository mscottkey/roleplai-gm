
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { endCurrentSessionAction } from '@/app/actions';

/**
 * NOTE: The functions in this file are designed to be run in a serverless environment
 * (like a Google Cloud Function) on a schedule (e.g., a cron job). They cannot be
 * run directly from the client-side Next.js application.
 */

/**
 * Queries the database for active game sessions that have been idle for longer than
 * their configured timeout period and ends them.
 *
 * This function is intended to be called by a scheduled job (e.g., every hour).
 */
export async function checkForIdleSessions() {
  console.log('Checking for idle sessions...');
  const db = getFirestore();
  const now = new Date();
  
  // Query for active games where auto-end is enabled.
  // We will filter by time in the function itself, as Firestore range queries on different fields are complex.
  const q = query(
    collection(db, 'games'),
    where('sessionStatus', '==', 'active'),
    where('worldState.autoEndEnabled', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const idleGamesToEnd: string[] = [];

  querySnapshot.forEach(doc => {
    const game = doc.data();
    const worldState = game.worldState;
    
    if (worldState && worldState.lastActivity) {
      const lastActivityDate = new Date(worldState.lastActivity);
      const idleTimeoutMinutes = worldState.idleTimeoutMinutes || 120;
      
      const minutesSinceLastActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);

      if (minutesSinceLastActivity > idleTimeoutMinutes) {
        idleGamesToEnd.push(doc.id);
      }
    }
  });

  if (idleGamesToEnd.length > 0) {
    console.log(`Found ${idleGamesToEnd.length} idle games to end. Ending them now...`);
    // In a real implementation, you might want to send notifications here.
    
    for (const gameId of idleGamesToEnd) {
      try {
        await endCurrentSessionAction(gameId, 'idle_timeout');
        console.log(`Successfully ended session for game ${gameId} due to inactivity.`);
      } catch (error) {
        console.error(`Failed to end session for idle game ${gameId}:`, error);
      }
    }
  } else {
    console.log('No idle sessions found.');
  }
}

/**
 * Placeholder for tracking activity. The actual implementation is a server action
 * to avoid exposing database update logic to the client.
 */
export function trackSessionActivity() {
    // This is a placeholder. The actual logic is handled by the `trackSessionActivityAction`
    // server action, which is called from the client to update the timestamp securely.
    console.log("Activity tracked. Timestamp will be updated on the server.");
}
