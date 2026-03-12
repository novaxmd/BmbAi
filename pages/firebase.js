// pages/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    limit, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYx3f1rAMcNfJ-Aji09TrTV5QUVpeORnw",
    authDomain: "nova-xmd-data.firebaseapp.com",
    databaseURL: "https://nova-xmd-data-default-rtdb.firebaseio.com",
    projectId: "nova-xmd-data",
    storageBucket: "nova-xmd-data.firebasestorage.app",
    messagingSenderId: "579565733751",
    appId: "1:579565733751:web:c7e214361081a1ae628372",
    measurementId: "G-MJZQMWWCEV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { 
    app, 
    auth, 
    db, 
    storage,
    // Auth functions
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    // Firestore functions
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    // Storage functions
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};
