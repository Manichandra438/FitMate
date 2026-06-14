import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword,
} from 'firebase/auth';
import { auth, WEB_CLIENT_ID } from './firebase';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

/** Maps Firebase auth error codes to user-friendly messages. */
export function friendlyAuthError(err: any): string {
  switch (err?.code) {
    case 'auth/invalid-email':       return 'Enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':  return 'Incorrect email or password.';
    case 'auth/wrong-password':      return 'Incorrect password.';
    case 'auth/email-already-in-use':return 'That email is already registered — try signing in.';
    case 'auth/weak-password':       return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':   return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/operation-not-allowed': return 'Email sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    default: return err?.message ?? 'Something went wrong. Please try again.';
  }
}

export function getAuthProvider(): 'google' | 'email' | 'unknown' {
  const user = auth.currentUser;
  if (!user) return 'unknown';
  const providers = user.providerData.map((p) => p.providerId);
  if (providers.includes('google.com')) return 'google';
  if (providers.includes('password')) return 'email';
  return 'unknown';
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google Sign-In returned no ID token');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await sendEmailVerification(result.user);
  } catch {
    // best effort — don't block the flow if verification email fails
  }
  return result.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await sendEmailVerification(user);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No signed-in user');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function signOutAll() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — Google session may already be gone or user signed in with email
  }
  await fbSignOut(auth);
}

async function reauthenticate(emailPassword?: { email: string; password: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user');
  const provider = getAuthProvider();
  if (provider === 'google') {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response) || !response.data.idToken) {
      throw new Error('Re-authentication cancelled');
    }
    const credential = GoogleAuthProvider.credential(response.data.idToken);
    await reauthenticateWithCredential(user, credential);
  } else {
    if (!emailPassword) throw new Error('Password required for re-authentication');
    const credential = EmailAuthProvider.credential(emailPassword.email, emailPassword.password);
    await reauthenticateWithCredential(user, credential);
  }
}

/**
 * Deletes the Firebase account. Caller must delete Firestore data FIRST.
 * For email users pass { email, password } for re-auth when required.
 */
export async function deleteAccount(emailPassword?: { email: string; password: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user');
  try {
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      await reauthenticate(emailPassword);
      await deleteUser(auth.currentUser!);
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
