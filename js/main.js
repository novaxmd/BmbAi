/**
 * BmbAi Landing Page JavaScript
 * Handles navigation, tabs, animations, and interactions
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
    
    // Get theme from localStorage or system preference
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('bmbai-theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    // Apply theme to document
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('bmbai-theme', theme);
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        
        // Add animation class
        if (themeToggle) {
            themeToggle.classList.add('toggling');
            setTimeout(() => {
                themeToggle.classList.remove('toggling');
            }, 400);
        }
    }
    
    // Initialize theme on page load
    applyTheme(getPreferredTheme());
    
    // Theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Listen for system theme changes
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
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    if (footerLogo) {
        footerLogo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =========================================
    // Navigation
    // =========================================
    
    // Scroll-based navbar styling
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    // Mobile navigation toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile nav when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close mobile nav when clicking outside
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

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =========================================
    // Tabs
    // =========================================
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content visibility
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
                
                // Visual feedback
                button.classList.add('copied');
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = originalHTML;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    button.classList.add('copied');
                    setTimeout(() => button.classList.remove('copied'), 2000);
                } catch (e) {
                    console.error('Fallback copy failed:', e);
                }
                
                document.body.removeChild(textArea);
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
    
    // Start typing animation after a short delay
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
    
    // Observe elements for scroll animations
    document.querySelectorAll('.feature-card, .step-card, .privacy-list li, .setup-step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        animateOnScroll.observe(el);
    });

    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
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
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
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
    // Keyboard Navigation
    // =========================================
    
    // ESC key closes mobile nav
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            navToggle?.classList.remove('active');
            navLinks?.classList.remove('active');
        }
    });

    // =========================================
    // Performance: Debounce scroll events
    // =========================================
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Apply debouncing to scroll-heavy operations
    const debouncedHighlight = debounce(highlightNavLink, 10);
    window.removeEventListener('scroll', highlightNavLink);
    window.addEventListener('scroll', debouncedHighlight);

    // =========================================
    // Prefers Reduced Motion
    // =========================================
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.querySelectorAll('.extension-preview, .privacy-shield, .hero-scroll a').forEach(el => {
            el.style.animation = 'none';
        });
    }

})();
