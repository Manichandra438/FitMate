import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  signInWithCredential,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, WEB_CLIENT_ID } from './firebase';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    return null; // user cancelled
  }
  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google Sign-In returned no ID token');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOutAll() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — Google session may already be gone
  }
  await fbSignOut(auth);
}

async function reauthenticate() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || !response.data.idToken) {
    throw new Error('Re-authentication cancelled');
  }
  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user');
  await reauthenticateWithCredential(user, credential);
}

/**
 * Deletes the Firebase account. Caller must delete Firestore data FIRST —
 * after this the user is signed out and security rules block further writes.
 */
export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user');
  try {
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      await reauthenticate();
      await deleteUser(user);
    } else {
      throw err;
    }
  }
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {
    // best effort
  }
}
