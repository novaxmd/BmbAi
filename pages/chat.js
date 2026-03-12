// pages/chat.js
import { 
    db,
    auth,
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
} from './firebase.js';
import { getCurrentUser } from './auth.js';

// =========================================
// State
// =========================================
let currentChatId = null;
let chats = [];
let messages = [];
let messagesListener = null;
let chatsListener = null;

// =========================================
// Load User Chats
// =========================================
export async function loadUserChats() {
    const { user } = getCurrentUser();
    if (!user) return [];
    
    try {
        // Unsubscribe from previous listener
        if (chatsListener) {
            chatsListener();
        }
        
        const chatsRef = collection(db, "chats");
        const q = query(
            chatsRef, 
            where("userId", "==", user.uid),
            orderBy("updatedAt", "desc")
        );
        
        chatsListener = onSnapshot(q, (snapshot) => {
            chats = [];
            snapshot.forEach((doc) => {
                chats.push({ id: doc.id, ...doc.data() });
            });
            
            updateChatHistoryUI();
            
            // Select first chat if none selected
            if (chats.length > 0 && !currentChatId) {
                selectChat(chats[0].id);
            }
        });
        
        return chats;
    } catch (error) {
        console.error("Load chats error:", error);
        return [];
    }
}

// =========================================
// Create New Chat
// =========================================
export async function createNewChat(title = "New Chat") {
    const { user } = getCurrentUser();
    if (!user) {
        showNotification('Please login to create a chat', 'info');
        return null;
    }
    
    try {
        const chatRef = await addDoc(collection(db, "chats"), {
            userId: user.uid,
            title: title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Add welcome message
        await addMessage(
            chatRef.id,
            "Hello! I'm BmbAi. How can I help you today? 😊",
            true,
            'text'
        );
        
        showNotification('New chat created', 'success');
        return chatRef.id;
    } catch (error) {
        console.error("Create chat error:", error);
        showNotification(error.message, 'error');
        return null;
    }
}

// =========================================
// Select Chat
// =========================================
export function selectChat(chatId) {
    if (!chatId) return;
    
    currentChatId = chatId;
    
    // Update UI
    document.querySelectorAll('.history-item').forEach(item => {
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Load messages
    loadMessages(chatId);
}

// =========================================
// Load Messages
// =========================================
function loadMessages(chatId) {
    // Unsubscribe from previous listener
    if (messagesListener) {
        messagesListener();
    }
    
    try {
        const messagesRef = collection(db, "messages");
        const q = query(
            messagesRef,
            where("chatId", "==", chatId),
            orderBy("createdAt", "asc")
        );
        
        messagesListener = onSnapshot(q, (snapshot) => {
            messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            updateMessagesUI();
        });
    } catch (error) {
        console.error("Load messages error:", error);
    }
}

// =========================================
// Add Message
// =========================================
export async function addMessage(chatId, content, isBot = false, type = 'text', fileUrl = null, fileName = null) {
    if (!chatId) return null;
    
    try {
        const messageRef = await addDoc(collection(db, "messages"), {
            chatId: chatId,
            content: content,
            type: type,
            fileUrl: fileUrl,
            fileName: fileName,
            isBot: isBot,
            createdAt: new Date().toISOString()
        });
        
        // Update chat's updatedAt
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            updatedAt: new Date().toISOString()
        });
        
        return messageRef.id;
    } catch (error) {
        console.error("Add message error:", error);
        return null;
    }
}

// =========================================
// Send Message (User)
// =========================================
export async function sendUserMessage(content, type = 'text', fileUrl = null, fileName = null) {
    if (!currentChatId) {
        // Create new chat if none selected
        const newChatId = await createNewChat();
        if (newChatId) {
            currentChatId = newChatId;
        } else {
            return;
        }
    }
    
    // Add user message
    await addMessage(currentChatId, content, false, type, fileUrl, fileName);
    
    // Get bot response (using BmbAI from api.js)
    if (window.BmbAI && type === 'text') {
        try {
            const provider = document.querySelector('.provider-option.active')?.dataset.provider || 'openai';
            
            // Show typing indicator
            showTypingIndicator();
            
            const response = await window.BmbAI.sendMessage(content, provider);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            if (response.success) {
                await addMessage(currentChatId, response.message, true, 'text');
            } else {
                await addMessage(currentChatId, response.message || 'Sorry, I could not process that.', true, 'text');
            }
        } catch (error) {
            hideTypingIndicator();
            console.error("Bot response error:", error);
            await addMessage(currentChatId, 'Sorry, an error occurred.', true, 'text');
        }
    }
}

// =========================================
// Delete Chat
// =========================================
export async function deleteChat(chatId) {
    if (!chatId) return;
    
    if (!confirm('Delete this chat?')) return;
    
    try {
        // Delete all messages in chat
        const messagesRef = collection(db, "messages");
        const q = query(messagesRef, where("chatId", "==", chatId));
        const snapshot = await getDocs(q);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        // Delete chat
        await deleteDoc(doc(db, "chats", chatId));
        
        showNotification('Chat deleted', 'info');
        
        // Select another chat if available
        if (currentChatId === chatId) {
            const { user } = getCurrentUser();
            if (user) {
                loadUserChats();
            }
        }
    } catch (error) {
        console.error("Delete chat error:", error);
        showNotification(error.message, 'error');
    }
}

// =========================================
// Update Chat History UI
// =========================================
function updateChatHistoryUI() {
    const historyContainer = document.getElementById('chatHistory');
    if (!historyContainer) return;
    
    const { profile } = getCurrentUser();
    
    if (chats.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-comments"></i>
                <p>No chats yet</p>
                <button class="new-chat-btn-small" onclick="window.createNewChat()">
                    Start new chat
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    chats.forEach(chat => {
        const time = new Date(chat.updatedAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        html += `
            <div class="history-item ${currentChatId === chat.id ? 'active' : ''}" 
                 data-chat-id="${chat.id}"
                 onclick="window.selectChat('${chat.id}')">
                <div class="history-avatar">
                    <img src="./assets/bmb-avatar.png" alt="Chat">
                </div>
                <div class="history-info">
                    <div class="history-name">${chat.title || 'BmbAi Chat'}</div>
                    <div class="history-preview">${chat.lastMessage || 'Click to start'}</div>
                </div>
                <div class="history-time">
                    ${time}
                    <i class="fas fa-times delete-chat" 
                       onclick="event.stopPropagation(); window.deleteChat('${chat.id}')"></i>
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// =========================================
// Update Messages UI
// =========================================
function updateMessagesUI() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const { profile } = getCurrentUser();
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comment-dots"></i>
                <p>Start a conversation</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const time = new Date(msg.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const isUser = !msg.isBot;
        
        html += `
            <div class="message ${isUser ? 'user' : 'bot'}">
                <div class="message-avatar">
                    <img src="${isUser ? (profile?.avatarUrl || './assets/default-avatar.png') : './assets/bmb-avatar.png'}" 
                         alt="${isUser ? 'You' : 'BmbAi'}">
                </div>
                <div class="message-content-wrapper">
                    <div class="message-sender">${isUser ? 'You' : 'BmbAi Assistant'}</div>
                    <div class="message-content">
                        ${msg.type === 'text' ? `<div class="message-text">${msg.content}</div>` : ''}
                        ${msg.type === 'image' ? `
                            <img src="${msg.fileUrl}" class="message-image" 
                                 onclick="window.open('${msg.fileUrl}')">
                            ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
                        ` : ''}
                        ${msg.type === 'file' ? `
                            <a href="${msg.fileUrl}" class="message-file" target="_blank">
                                <i class="fas fa-file"></i> ${msg.fileName || 'File'}
                            </a>
                            ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
                        ` : ''}
                        ${msg.type === 'voice' ? `
                            <audio controls src="${msg.fileUrl}" class="message-voice"></audio>
                        ` : ''}
                        <div class="message-time">
                            ${time}
                            <span class="message-status">
                                <i class="fas fa-check-double"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// =========================================
// Typing Indicator
// =========================================
let typingTimeout = null;

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    // Add bot avatar before indicator
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot typing-wrapper';
    wrapper.id = 'typingWrapper';
    wrapper.innerHTML = `
        <div class="message-avatar">
            <img src="./assets/bmb-avatar.png" alt="BmbAi">
        </div>
    `;
    wrapper.querySelector('.message-avatar').after(indicator);
    
    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const wrapper = document.getElementById('typingWrapper');
    if (wrapper) wrapper.remove();
}

// =========================================
// Initialize Chat
// =========================================
export function initChat() {
    // Load chats when user is logged in
    const { user } = getCurrentUser();
    if (user) {
        loadUserChats();
    }
    
    // Add auth listener to reload chats on login/logout
    import('./auth.js').then(({ addAuthListener }) => {
        addAuthListener((user) => {
            if (user) {
                loadUserChats();
            } else {
                // Clear UI for logged out
                document.getElementById('chatHistory').innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-lock"></i>
                        <p>Login to see your chats</p>
                    </div>
                `;
                document.getElementById('chatMessages').innerHTML = '';
                currentChatId = null;
                chats = [];
                messages = [];
            }
        });
    });
}

// Make functions available globally
window.selectChat = selectChat;
window.deleteChat = deleteChat;
window.createNewChat = createNewChat;
