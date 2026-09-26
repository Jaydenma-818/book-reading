// Firebase auth error codes are precise but unfriendly; these are the ones a
// login form actually produces.
const messages = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/missing-password': 'Please enter your password.',
  'auth/weak-password': 'Please choose a password of at least 6 characters.',
  'auth/email-already-in-use': 'That email already has an account. Try signing in.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
  'auth/cancelled-popup-request': 'The Google sign-in window was closed.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  'auth/operation-not-allowed':
    'That sign-in method is disabled for this Firebase project. Enable it in the Firebase console.',
  'auth/unauthorized-domain':
    'This domain is not authorized for sign-in. Add it in the Firebase console under Authentication → Settings.',
}

export function authErrorMessage(error) {
  return messages[error?.code] ?? error?.message ?? 'Something went wrong. Please try again.'
}
