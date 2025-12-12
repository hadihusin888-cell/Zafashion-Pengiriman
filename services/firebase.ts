// Firebase has been removed in favor of Google Sheets / LocalStorage
// This file is kept to prevent import errors in other files during migration, 
// but it no longer initializes the Firebase App.

export const auth = {
  currentUser: { uid: 'guest', email: 'guest@store.com', displayName: 'Admin Toko' },
  signOut: async () => true
};

export const db = {};
export const googleProvider = {};
