// pages/auth.js
import { 
    auth,
    db,
    storage,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
} from './firebase.js';

// =========================================
// Current User State
// =========================================
let currentUser = null;
let currentUserProfile = null;
let authListeners = [];

// =========================================
// Auth State Observer
// =========================================
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
        // Get user profile from Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                currentUserProfile = userDoc.data();
            } else {
                // Create profile if not exists
                currentUserProfile = {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || 'User',
                    avatarUrl: '',
                    phone: '',
                    bio: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await setDoc(doc(db, "users", user.uid), currentUserProfile);
            }
        } catch (error) {
            console.error("Error getting user profile:", error);
        }
        
        // Update UI
        updateUIForLoggedInUser();
    } else {
        currentUserProfile = null;
        updateUIForLoggedOutUser();
    }
    
    // Notify listeners
    authListeners.forEach(listener => listener(user, currentUserProfile));
});

// =========================================
// Sign Up
// =========================================
export async function signUp(email, password, fullName) {
    try {
        // Validate inputs
        if (!email || !password || !fullName) {
            throw new Error('All fields are required');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, { displayName: fullName });
        
        // Create user profile in Firestore
        const userProfile = {
            uid: user.uid,
            email: email,
            fullName: fullName,
            avatarUrl: '',
            phone: '',
            bio: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", user.uid), userProfile);
        
        // Create default chat
        await createDefaultChat(user.uid);
        
        showNotification('Account created successfully! ✓', 'success');
        return { success: true, user };
    } catch (error) {
        console.error("Signup error:", error);
        let message = error.message;
        if (error.code === 'auth/email-already-in-use') {
            message = 'Email already in use';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak';
        }
        showNotification(message, 'error');
        return { success: false, error: message };
    }
}

// =========================================
// Sign In
// =========================================
export async function signIn(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showNotification('Logged in successfully! 👋', 'success');
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login error:", error);
        let message = error.message;
        if (error.code === 'auth/user-not-found') {
            message = 'User not found';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Wrong password';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        }
        showNotification(message, 'error');
        return { success: false, error: message };
    }
}

// =========================================
// Sign Out
// =========================================
export async function signOutUser() {
    try {
        await signOut(auth);
        showNotification('Logged out', 'info');
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// =========================================
// Reset Password
// =========================================
export async function resetPassword(email) {
    try {
        if (!email) {
            throw new Error('Email is required');
        }
        await sendPasswordResetEmail(auth, email);
        showNotification('Password reset email sent! Check your inbox 📧', 'success');
        return { success: true };
    } catch (error) {
        console.error("Reset password error:", error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// =========================================
// Update Profile
// =========================================
export async function updateUserProfile(profileData) {
    try {
        if (!currentUser) {
            throw new Error('You must be logged in');
        }
        
        const { fullName, phone, bio, avatarFile } = profileData;
        const updates = {};
        
        // Update display name in Auth
        if (fullName && fullName !== currentUser.displayName) {
            await updateProfile(currentUser, { displayName: fullName });
            updates.fullName = fullName;
        }
        
        // Upload avatar if provided
        if (avatarFile) {
            const avatarUrl = await uploadAvatar(avatarFile);
            updates.avatarUrl = avatarUrl;
        }
        
        // Add other fields
        if (phone) updates.phone = phone;
        if (bio) updates.bio = bio;
        updates.updatedAt = new Date().toISOString();
        
        // Update Firestore
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updates);
        
        // Update local profile
        if (currentUserProfile) {
            Object.assign(currentUserProfile, updates);
        }
        
        // Update UI
        updateUIForLoggedInUser();
        
        showNotification('Profile updated successfully! ✨', 'success');
        return { success: true };
    } catch (error) {
        console.error("Update profile error:", error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// =========================================
// Upload Avatar
// =========================================
async function uploadAvatar(file) {
    try {
        const fileRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        return url;
    } catch (error) {
        console.error("Avatar upload error:", error);
        throw error;
    }
}

// =========================================
// Create Default Chat
// =========================================
async function createDefaultChat(userId) {
    try {
        const chatRef = await addDoc(collection(db, "chats"), {
            userId: userId,
            title: "BmbAi Assistant",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Add welcome message
        await addDoc(collection(db, "messages"), {
            chatId: chatRef.id,
            content: "Hello! I'm BmbAi. How can I help you today? 😊",
            type: 'text',
            isBot: true,
            createdAt: new Date().toISOString()
        });
        
        return chatRef.id;
    } catch (error) {
        console.error("Create default chat error:", error);
    }
}

// =========================================
// Update UI for Logged In User
// =========================================
function updateUIForLoggedInUser() {
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    const sidebarAvatar = document.getElementById('userAvatarImg');
    const authBtn = document.getElementById('authBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    if (sidebarName) {
        sidebarName.textContent = currentUserProfile?.fullName || currentUser?.displayName || 'User';
    }
    if (sidebarEmail) {
        sidebarEmail.textContent = currentUser?.email || '';
    }
    if (sidebarAvatar && currentUserProfile?.avatarUrl) {
        sidebarAvatar.src = currentUserProfile.avatarUrl;
    }
    if (authBtn) {
        authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        authBtn.onclick = () => signOutUser();
    }
    if (editProfileBtn) {
        editProfileBtn.style.display = 'flex';
    }
}

// =========================================
// Update UI for Logged Out User
// =========================================
function updateUIForLoggedOutUser() {
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    const sidebarAvatar = document.getElementById('userAvatarImg');
    const authBtn = document.getElementById('authBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    if (sidebarName) {
        sidebarName.textContent = 'Guest User';
    }
    if (sidebarEmail) {
        sidebarEmail.textContent = 'Not logged in';
    }
    if (sidebarAvatar) {
        sidebarAvatar.src = './assets/default-avatar.png';
    }
    if (authBtn) {
        authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        authBtn.onclick = () => {
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.add('active');
        };
    }
    if (editProfileBtn) {
        editProfileBtn.style.display = 'none';
    }
}

// =========================================
// Add Auth Listener
// =========================================
export function addAuthListener(callback) {
    authListeners.push(callback);
    if (currentUser) {
        callback(currentUser, currentUserProfile);
    }
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
}

// =========================================
// Get Current User
// =========================================
export function getCurrentUser() {
    return { user: currentUser, profile: currentUserProfile };
}

// =========================================
// Initialize Auth Forms
// =========================================
export function initAuthForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await signIn(email, password);
            if (result.success) {
                document.getElementById('authModal')?.classList.remove('active');
                loginForm.reset();
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirmPassword').value;
            
            if (password !== confirm) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            const result = await signUp(email, password, name);
            if (result.success) {
                document.getElementById('authModal')?.classList.remove('active');
                signupForm.reset();
            }
        });
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('profileName').value;
            const phone = document.getElementById('profilePhone').value;
            const bio = document.getElementById('profileBio').value;
            const avatarFile = document.getElementById('avatarInput').files[0];
            
            const result = await updateUserProfile({
                fullName, phone, bio, avatarFile
            });
            
            if (result.success) {
                document.getElementById('profileModal')?.classList.remove('active');
            }
        });
        
        // Pre-fill form with current data
        if (currentUserProfile) {
            document.getElementById('profileName').value = currentUserProfile.fullName || '';
            document.getElementById('profilePhone').value = currentUserProfile.phone || '';
            document.getElementById('profileBio').value = currentUserProfile.bio || '';
        }
    }
}

// Show notification helper
function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}
