// pages/storage.js
import { 
    storage,
    db,
    auth,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    collection,
    addDoc,
    serverTimestamp
} from './firebase.js';
import { getCurrentUser } from './auth.js';
import { sendUserMessage } from './chat.js';

// =========================================
// Upload File
// =========================================
export async function uploadFile(file, type = 'file', onProgress = null) {
    const { user } = getCurrentUser();
    if (!user) {
        showNotification('Please login to upload files', 'info');
        return null;
    }
    
    try {
        // Create file reference
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.uid}_${timestamp}.${fileExt}`;
        
        let folder = 'files';
        if (type === 'image') folder = 'images';
        if (type === 'voice') folder = 'voice';
        
        const fileRef = ref(storage, `${folder}/${fileName}`);
        
        // Upload file
        const snapshot = await uploadBytes(fileRef, file);
        
        // Get download URL
        const downloadUrl = await getDownloadURL(fileRef);
        
        return {
            url: downloadUrl,
            name: file.name,
            size: file.size,
            type: file.type,
            path: snapshot.ref.fullPath
        };
    } catch (error) {
        console.error("Upload error:", error);
        showNotification('Upload failed: ' + error.message, 'error');
        return null;
    }
}

// =========================================
// Upload Image and Send
// =========================================
export async function uploadAndSendImage(file, caption = '') {
    try {
        showNotification('Uploading image...', 'info');
        
        const result = await uploadFile(file, 'image');
        
        if (result) {
            await sendUserMessage(caption || '📷 Image', 'image', result.url, result.name);
            showNotification('Image sent! ✓', 'success');
        }
    } catch (error) {
        console.error("Image upload error:", error);
        showNotification(error.message, 'error');
    }
}

// =========================================
// Upload File and Send
// =========================================
export async function uploadAndSendFile(file) {
    try {
        showNotification('Uploading file...', 'info');
        
        const result = await uploadFile(file, 'file');
        
        if (result) {
            await sendUserMessage(`📎 File: ${result.name}`, 'file', result.url, result.name);
            showNotification('File sent! ✓', 'success');
        }
    } catch (error) {
        console.error("File upload error:", error);
        showNotification(error.message, 'error');
    }
}

// =========================================
// Upload Voice Message
// =========================================
export async function uploadAndSendVoice(blob) {
    try {
        // Convert blob to file
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        showNotification('Uploading voice message...', 'info');
        
        const result = await uploadFile(file, 'voice');
        
        if (result) {
            await sendUserMessage('🎤 Voice message', 'voice', result.url, result.name);
            showNotification('Voice message sent! ✓', 'success');
        }
    } catch (error) {
        console.error("Voice upload error:", error);
        showNotification(error.message, 'error');
    }
}

// =========================================
// Delete File
// =========================================
export async function deleteFile(filePath) {
    try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error("Delete error:", error);
        return false;
    }
}

// =========================================
// Voice Recording
// =========================================
export class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }
    
    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await uploadAndSendVoice(audioBlob);
                
                // Stop all tracks
                this.stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            return true;
        } catch (error) {
            console.error("Voice recording error:", error);
            showNotification('Microphone access denied', 'error');
            return false;
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }
}

// =========================================
// Initialize File Upload Handlers
// =========================================
export function initStorage() {
    const imageInput = document.getElementById('imageInput');
    const fileInput = document.getElementById('fileInput');
    const voiceBtn = document.getElementById('voiceBtn');
    const sendImageBtn = document.getElementById('sendImageBtn');
    
    let voiceRecorder = null;
    
    // Image upload
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const previewImage = document.getElementById('previewImage');
                    if (previewImage) {
                        previewImage.src = ev.target.result;
                        document.getElementById('imagePreviewModal')?.classList.add('active');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Please select an image file', 'error');
            }
        });
    }
    
    // Send image button
    if (sendImageBtn) {
        sendImageBtn.addEventListener('click', async () => {
            const file = imageInput?.files[0];
            const caption = document.getElementById('imageCaption')?.value || '';
            
            if (file) {
                await uploadAndSendImage(file, caption);
                document.getElementById('imagePreviewModal')?.classList.remove('active');
                if (imageInput) imageInput.value = '';
                if (document.getElementById('imageCaption')) document.getElementById('imageCaption').value = '';
            }
        });
    }
    
    // File upload
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadAndSendFile(file);
                fileInput.value = '';
            }
        });
    }
    
    // Voice recording
    if (voiceBtn) {
        voiceBtn.addEventListener('click', async () => {
            if (!voiceRecorder) {
                voiceRecorder = new VoiceRecorder();
            }
            
            if (voiceRecorder.isRecording) {
                voiceRecorder.stopRecording();
                voiceBtn.classList.remove('recording');
            } else {
                const started = await voiceRecorder.startRecording();
                if (started) {
                    voiceBtn.classList.add('recording');
                    
                    // Auto-stop after 30 seconds
                    setTimeout(() => {
                        if (voiceRecorder.isRecording) {
                            voiceRecorder.stopRecording();
                            voiceBtn.classList.remove('recording');
                        }
                    }, 30000);
                }
            }
        });
    }
}
