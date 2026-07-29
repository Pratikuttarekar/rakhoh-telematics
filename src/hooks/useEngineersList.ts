import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { User, UserRole } from '../types/fsm';

export function useEngineersList(): User[] {
  const [engineersList, setEngineersList] = useState<User[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // 1. Create query for active site engineers
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'engineer')
    );

    // 2. Attach live snapshot listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const engineers = snapshot.docs.map((doc) => {
          const data = doc.data() as User;
          return {
            ...data,
            uid: doc.id || data.uid,
            role: 'engineer' as UserRole,
          };
        });
        setEngineersList(engineers);
      },
      (error) => {
        console.error('Firestore live tracking error:', error);
      }
    );

    // 3. Cleanup listener when leaving component
    return () => unsubscribe();
  }, []);

  return engineersList;
}
