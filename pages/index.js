// pages/index.js
// Export all Firebase modules for easy import

export { default as firebase } from './firebase.js';
export * as auth from './auth.js';
export * as chat from './chat.js';
export * as storage from './storage.js';

// Initialize all modules
import { initAuthForms } from './auth.js';
import { initChat } from './chat.js';
import { initStorage } from './storage.js';

export function initializeApp() {
    initAuthForms();
    initChat();
    initStorage();
    console.log('🔥 Firebase modules initialized');
}
