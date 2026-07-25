import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, User } from '../types/fsm';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  authRole: UserRole | null;
  authEmail: string | null;
  currentUserDoc: User | null;
  isLoading: boolean;
  login: (expectedPortalRole: UserRole, email: string, password: string) => Promise<UserRole>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authRole, setAuthRole] = useState<UserRole | null>(() => {
    return (sessionStorage.getItem('fsm_user_role') as UserRole) || null;
  });
  const [authEmail, setAuthEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('fsm_user_email') || null;
  });
  const [currentUserDoc, setCurrentUserDoc] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch or upsert Firestore document /users/{uid} for admin@rakhoh.com
  const fetchUserRoleFromFirestore = async (uid: string, emailVal: string): Promise<{ role: UserRole; docData: User | null }> => {
    const isExplicitAdminEmail =
      emailVal.toLowerCase().trim() === 'admin@rakhoh.com' ||
      emailVal.toLowerCase().trim().startsWith('admin@');

    try {
      if (db) {
        // Try direct document /users/{uid} first
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data() as User;
          setCurrentUserDoc(docData);
          if (docData.role) {
            return { role: docData.role, docData };
          }
        }

        // Query by email if /users/{uid} document key is different
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', emailVal.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data() as User;
          setCurrentUserDoc(docData);
          if (docData.role) {
            return { role: docData.role, docData };
          }
        }

        // Automatically upsert/create document in Firestore if document is missing or role is undefined
        if (isExplicitAdminEmail) {
          const adminDocPayload: Partial<User> = {
            uid,
            engineerId: 'ADM_001',
            name: 'Admin Dispatcher',
            email: emailVal.toLowerCase().trim(),
            role: 'admin',
            status: 'online',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, adminDocPayload, { merge: true });
          setCurrentUserDoc(adminDocPayload as User);
          return { role: 'admin', docData: adminDocPayload as User };
        }
      }
    } catch (err) {
      console.warn('Firestore user fetch warning:', err);
    }

    if (isExplicitAdminEmail) {
      return { role: 'admin', docData: null };
    }
    return { role: 'engineer', docData: null };
  };

  useEffect(() => {
    // Restore session on mount
    if (authEmail && authRole) {
      const uid = sessionStorage.getItem('fsm_user_uid') || '';
      fetchUserRoleFromFirestore(uid, authEmail).then(({ role }) => {
        setAuthRole(role);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (expectedPortalRole: UserRole, emailVal: string, passVal: string): Promise<UserRole> => {
    setIsLoading(true);

    if (!auth) {
      setIsLoading(false);
      throw new Error('Firebase Authentication is not configured.');
    }

    const cleanEmail = emailVal.trim();
    const isExplicitAdminEmail =
      cleanEmail.toLowerCase() === 'admin@rakhoh.com' ||
      cleanEmail.toLowerCase().startsWith('admin@');

    try {
      // 1. Strict Real-Time Firebase Auth Call
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, passVal.trim());
      const uid = userCred.user.uid;

      // 2. Fetch or Upsert User Record from Firestore /users/{uid}
      const { role: fetchedRole } = await fetchUserRoleFromFirestore(uid, cleanEmail);

      const finalRole: UserRole = isExplicitAdminEmail || fetchedRole === 'admin' ? 'admin' : fetchedRole;

      // 3. Role-Based Access Control Verification
      if (expectedPortalRole === 'admin' && finalRole !== 'admin') {
        await signOut(auth);
        throw new Error('ACCESS_DENIED_ADMIN');
      }

      setAuthRole(finalRole);
      setAuthEmail(cleanEmail);
      sessionStorage.setItem('fsm_user_role', finalRole);
      sessionStorage.setItem('fsm_user_email', cleanEmail);
      sessionStorage.setItem('fsm_user_uid', uid);

      return finalRole;
    } catch (err: any) {
      // Clear any partial session
      setAuthRole(null);
      setAuthEmail(null);
      sessionStorage.removeItem('fsm_user_role');
      sessionStorage.removeItem('fsm_user_email');
      sessionStorage.removeItem('fsm_user_uid');

      const code = err?.code || '';
      const msg = err?.message || '';

      if (msg === 'ACCESS_DENIED_ADMIN') {
        throw new Error('Access Denied: Admin credentials required.');
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        throw new Error('Wrong Username / Email Address');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Wrong Password');
      } else {
        throw new Error(msg || 'Invalid Login Credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (auth) signOut(auth).catch(() => {});
    sessionStorage.removeItem('fsm_user_role');
    sessionStorage.removeItem('fsm_user_email');
    sessionStorage.removeItem('fsm_user_uid');
    setAuthRole(null);
    setAuthEmail(null);
    setCurrentUserDoc(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authRole,
        authEmail,
        currentUserDoc,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
