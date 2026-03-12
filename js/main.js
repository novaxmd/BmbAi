/**
 * BmbAi Landing Page JavaScript
 * Handles navigation, tabs, animations, and chat interactions
 */

(function() {
    'use strict';

    // =========================================
    // DOM Elements
    // =========================================
    
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const themeToggle = document.getElementById('themeToggle');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const copyButtons = document.querySelectorAll('.copy-btn');

    // =========================================
    // Theme Management
    // =========================================
    
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('bmbai-theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('bmbai-theme', theme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        
        if (themeToggle) {
            themeToggle.classList.add('toggling');
            setTimeout(() => themeToggle.classList.remove('toggling'), 400);
        }
    }
    
    applyTheme(getPreferredTheme());
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('bmbai-theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Logo click - smooth scroll to top
    const logo = document.querySelector('.nav-logo');
    const footerLogo = document.querySelector('.footer-logo');
    
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    if (footerLogo) {
        footerLogo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================
    // Navigation
    // =========================================
    
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Mobile navigation toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });

    // =========================================
    // Tabs
    // =========================================
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // =========================================
    // Copy to Clipboard
    // =========================================
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const textToCopy = button.dataset.copy;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                button.classList.add('copied');
                const originalHTML = button.innerHTML;
                button.innerHTML = `<i class="fas fa-check"></i>`;
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = originalHTML;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });

    // =========================================
    // Typing Animation
    // =========================================
    
    const typingTexts = [
        'How can I help you today?',
        'Summarize this article...',
        'Explain this code...',
        'What is machine learning?',
        'Write a function that...'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 80;
    const deletingSpeed = 40;
    const pauseDuration = 2000;
    
    const responseText = document.querySelector('.response-text');
    
    function typeText() {
        if (!responseText) return;
        const currentText = typingTexts[textIndex];
        
        if (isDeleting) {
            responseText.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="typing-cursor"></span>';
            charIndex--;
        } else {
            responseText.innerHTML = currentText.substring(0, charIndex + 1) + '<span class="typing-cursor"></span>';
            charIndex++;
        }
        
        let timeout = isDeleting ? deletingSpeed : typingSpeed;
        
        if (!isDeleting && charIndex === currentText.length) {
            timeout = pauseDuration;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % typingTexts.length;
            timeout = 500;
        }
        
        setTimeout(typeText, timeout);
    }
    
    setTimeout(typeText, 1000);

    // =========================================
    // Intersection Observer for Animations
    // =========================================
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .step-card, .privacy-list li, .setup-step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        animateOnScroll.observe(el);
    });

    const style = document.createElement('style');
    style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(style);

    // =========================================
    // Active Navigation Link
    // =========================================
    
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavLink() {
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            
            if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
                navLink.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);

    // =========================================
    // Provider Chip Animation
    // =========================================
    
    const providerChips = document.querySelectorAll('.provider-chip');
    let activeChipIndex = 0;
    
    function cycleProviders() {
        providerChips.forEach(chip => chip.classList.remove('active'));
        providerChips[activeChipIndex].classList.add('active');
        activeChipIndex = (activeChipIndex + 1) % providerChips.length;
    }
    
    if (providerChips.length > 0) {
        setInterval(cycleProviders, 3000);
    }

    // =========================================
    // App Container and Chat Interface
    // =========================================
    
    const startChatBtn = document.getElementById('startChatBtn');
    const appContainer = document.getElementById('appContainer');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    // Open chat app
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            appContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close chat app
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            appContainer.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Toggle sidebar on mobile
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // =========================================
    // Modal Management
    // =========================================
    
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    const imagePreviewModal = document.getElementById('imagePreviewModal');
    const authBtn = document.getElementById('authBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const modalCloses = document.querySelectorAll('.modal-close');
    
    // Open auth modal
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            authModal.classList.add('active');
        });
    }
    
    // Open profile modal
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            profileModal.classList.add('active');
        });
    }
    
    // Close modals
    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            authModal.classList.remove('active');
            profileModal.classList.remove('active');
            imagePreviewModal.classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // =========================================
    // Auth Tabs
    // =========================================
    
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        });
        
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    // =========================================
    // Chat Input
    // =========================================
    
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            if (sendMessageBtn) {
                sendMessageBtn.disabled = chatInput.value.trim().length === 0;
            }
        });
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Send message function (placeholder - itaunganishwa na Firebase)
    function sendMessage() {
        if (!chatInput || chatInput.value.trim().length === 0) return;
        
        const message = chatInput.value.trim();
        const messagesContainer = document.getElementById('chatMessages');
        
        // Add user message (temporarily - itaondolewa baada ya Firebase)
        const userMsg = createMessageElement(message, 'user');
        messagesContainer.appendChild(userMsg);
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendMessageBtn.disabled = true;
        
        // Simulate bot response after 1 second
        setTimeout(() => {
            const botMsg = createMessageElement("I'm BmbAi. How can I help you today?", 'bot');
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Create message element
    function createMessageElement(text, type, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let content = '';
        if (options.image) {
            content = `<img src="${options.image}" class="message-image" onclick="window.open('${options.image}')">`;
        } else if (options.file) {
            content = `<a href="${options.file}" class="message-file" target="_blank"><i class="fas fa-file"></i> ${options.fileName || 'File'}</a>`;
        }
        
        content += `<div class="message-text">${text}</div>`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="${type === 'user' ? './assets/default-avatar.png' : './assets/bmb-avatar.png'}" alt="${type}">
            </div>
            <div class="message-content-wrapper">
                <div class="message-sender">${type === 'user' ? 'You' : 'BmbAi Assistant'}</div>
                <div class="message-content">
                    ${content}
                    <div class="message-time">
                        ${time}
                        <span class="message-status"><i class="fas fa-check-double"></i></span>
                    </div>
                </div>
            </div>
        `;
        
        return messageDiv;
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }

    // =========================================
    // File Upload Handlers
    // =========================================
    
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    const voiceBtn = document.getElementById('voiceBtn');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const sendImageBtn = document.getElementById('sendImageBtn');
    const previewImage = document.getElementById('previewImage');
    const imageCaption = document.getElementById('imageCaption');
    
    // Attach file
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Handle file upload (itaunganishwa na Firebase Storage)
                showNotification(`File selected: ${file.name}`, 'info');
            }
        });
    }
    
    // Image upload
    if (imageBtn && imageInput) {
        imageBtn.addEventListener('click', () => imageInput.click());
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (previewImage) {
                        previewImage.src = ev.target.result;
                        imagePreviewModal.classList.add('active');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Please select an image file', 'error');
            }
        });
    }
    
    // Send image
    if (sendImageBtn && imagePreviewModal) {
        sendImageBtn.addEventListener('click', () => {
            const caption = imageCaption?.value || '';
            const imageUrl = previewImage?.src || '';
            
            if (imageUrl) {
                const messagesContainer = document.getElementById('chatMessages');
                const msg = createMessageElement(caption || '📷 Image', 'user', { image: imageUrl });
                messagesContainer.appendChild(msg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Simulate bot response
                setTimeout(() => {
                    const botMsg = createMessageElement("Nice image! How can I help you with it?", 'bot');
                    messagesContainer.appendChild(botMsg);
                }, 1000);
            }
            
            imagePreviewModal.classList.remove('active');
            if (imageCaption) imageCaption.value = '';
            if (imageInput) imageInput.value = '';
        });
    }
    
    // Voice message
    if (voiceBtn) {
        let isRecording = false;
        let recognition = null;
        
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add('recording');
                showNotification('Listening...', 'info');
            };
            
            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                if (chatInput) {
                    chatInput.value = transcript;
                    chatInput.style.height = 'auto';
                    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
                    if (sendMessageBtn) sendMessageBtn.disabled = false;
                }
            };
            
            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
            };
            
            recognition.onerror = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                showNotification('Voice recognition failed', 'error');
            };
        }
        
        voiceBtn.addEventListener('click', () => {
            if (recognition) {
                if (isRecording) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            } else {
                showNotification('Voice recognition not supported', 'error');
            }
        });
    }
    
    // Avatar change
    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', () => avatarInput.click());
        
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const avatarPreview = document.getElementById('profileAvatarPreview');
                    if (avatarPreview) {
                        avatarPreview.src = ev.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // =========================================
    // New Chat Button
    // =========================================
    
    const newChatBtn = document.getElementById('newChatBtn');
    
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                
                // Add welcome message
                const welcomeMsg = createMessageElement("Hello! I'm BmbAi. How can I help you today?", 'bot');
                messagesContainer.appendChild(welcomeMsg);
                
                // Clear input
                if (chatInput) {
                    chatInput.value = '';
                    chatInput.style.height = 'auto';
                }
                if (sendMessageBtn) sendMessageBtn.disabled = true;
            }
        });
    }

    // =========================================
    // Clear Chat
    // =========================================
    
    const clearChatBtn = document.getElementById('clearChatBtn');
    
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Clear all messages?')) {
                const messagesContainer = document.getElementById('chatMessages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                    const welcomeMsg = createMessageElement("Chat cleared. How can I help you?", 'bot');
                    messagesContainer.appendChild(welcomeMsg);
                }
            }
        });
    }

    // =========================================
    // Provider Selector
    // =========================================
    
    const providerOptions = document.querySelectorAll('.provider-option');
    
    providerOptions.forEach(option => {
        option.addEventListener('click', () => {
            providerOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            showNotification(`Switched to ${option.textContent} provider`, 'success');
        });
    });

    // =========================================
    // Search Chats
    // =========================================
    
    const searchChats = document.getElementById('searchChats');
    
    if (searchChats) {
        searchChats.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const historyItems = document.querySelectorAll('.history-item');
            
            historyItems.forEach(item => {
                const name = item.querySelector('.history-name')?.textContent.toLowerCase() || '';
                const preview = item.querySelector('.history-preview')?.textContent.toLowerCase() || '';
                
                if (name.includes(searchTerm) || preview.includes(searchTerm)) {
                    item.style.display = 'grid';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // =========================================
    // Notification System
    // =========================================
    
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // =========================================
    // Keyboard Navigation
    // =========================================
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            navToggle?.classList.remove('active');
            navLinks?.classList.remove('active');
            sidebar?.classList.remove('active');
            
            // Close modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // =========================================
    // Debounce scroll events
    // =========================================
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    const debouncedHighlight = debounce(highlightNavLink, 10);
    window.removeEventListener('scroll', highlightNavLink);
    window.addEventListener('scroll', debouncedHighlight);

    // =========================================
    // Prefers Reduced Motion
    // =========================================
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        document.querySelectorAll('.extension-preview, .privacy-shield, .hero-scroll a').forEach(el => {
            el.style.animation = 'none';
        });
    }

    // Initialize welcome message
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer && messagesContainer.children.length === 0) {
        const welcomeMsg = createMessageElement("Hello! I'm BmbAi. How can I help you today?", 'bot');
        messagesContainer.appendChild(welcomeMsg);
    }
})();
