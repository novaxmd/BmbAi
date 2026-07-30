# ⚡ Saqib AI Studio - The Ultimate Cyberpunk GenAI Toolkit

<div align="center">

![Version](https://img.shields.io/badge/Version-2.5.0_Ultimate-blue?style=for-the-badge&logo=rocket)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=license)
![Status](https://img.shields.io/badge/Status-Operational-emerald?style=for-the-badge&logo=statuspage)

<br/>

<img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white" />
<img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />

</div>

---

## 🌌 Overview

**Saqib AI Studio** is not just an application; it's a **futuristic command center** built for developers, creators, and security researchers. Wrapped in a stunning, high-performance **Cyberpunk UI**, this Progressive Web App (PWA) harnesses the raw power of **Google's Gemini 2.5 & 3.0 models** to deliver a suite of creative and analytical tools.

Whether you need to deobfuscate malware, generate full-stack websites from a napkin sketch, clone voices, or create digital art, Saqib AI Studio puts the future in your pocket.

---

## 🚀 Extreme Features

### 💻 **1. Code Studio**
*The heart of the engineering toolkit.*

*   **🛡️ AI Deobfuscator & Analyzer**: 
    *   Paste complex, obfuscated, or minified JavaScript.
    *   Get an instant security audit: **Risk Level**, **Purpose**, **Library Detection**, and **Deobfuscated Logic Snippets**.
    *   Perfect for security researchers analyzing malware or learning from complex code.
*   **✨ AI Website Builder (Multimodal)**:
    *   **Text-to-Code**: "Create a portfolio with a dark theme and neon accents." -> Get a fully responsive HTML/Tailwind file.
    *   **Image-to-Code**: Upload a screenshot of *any* website or a hand-drawn sketch, and watch Gemini recreate the code pixel-perfectly.
*   **🛠️ Developer Utilities**:
    *   Base64 Encoder/Decoder.
    *   URL Encoder/Decoder.
    *   Code Minifier.
    *   **File Sharing**: Compress and share your code via a unique URL.
*   **⚡ Live Preview Environment**:
    *   Run generated code instantly in a sandboxed iframe.
    *   Mobile/Desktop toggle.
    *   Console log emulation for debugging directly in the browser.

### 🎨 **2. Image Studio**
*A complete suite for visual creativity.*

*   **✨ AI Image Generator**: 
    *   Powered by `gemini-2.5-flash-image` (Nano Banana).
    *   Create stunning visuals from text prompts instantly.
*   **🔍 Prompt Extractor (Reverse Engineering)**:
    *   Upload *any* image to reveal the prompt used to generate it.
    *   Analyze lighting, camera settings, style, and composition details.
*   **🚀 Smart Host & Compressor**:
    *   Client-side smart compression (Auto-shrink to <150KB).
    *   Upload to Cloud (ImageKit) and get a permanent public URL for your assets.
*   **📥 Universal Downloader**:
    *   Fetch and download images from direct URLs (bypassing basic CORS restrictions via proxy).

### 🎙️ **3. Audio Studio**
*Next-gen voice synthesis and analysis.*

*   **🗣️ AI Text-to-Speech (TTS)**:
    *   Utilizes Gemini's advanced speech synthesis capabilities.
    *   **5 Premium Voices**: Puck, Charon, Kore, Fenrir, Zephyr.
    *   Download generated audio as MP3 files.
*   **🧠 Audio Intelligence**:
    *   Upload audio files (MP3/WAV).
    *   **Full Transcription**: Convert speech to text with high accuracy.
    *   **Summarization**: Get key points from meetings, voice notes, or lectures.
    *   **Language Detection**: Identify the spoken language instantly.

### 🤖 **4. Chat Studio**
*Your intelligent coding companion.*

*   **💬 Context-Aware Conversations**: Remembers your chat history for fluid dialogue.
*   **📝 Markdown & Code Support**: 
    *   Renders Tables, Lists, Bold/Italic text using `remark-gfm`.
    *   Syntax highlighting for code blocks with one-click "Copy" functionality.
*   **⚡ High Performance**: Streaming-like experience using React 19 architecture.

---

## 🏗️ Architecture & Tech Stack

This project is built on the bleeding edge of web technology, optimized for performance and aesthetics.

*   **Core Framework**: [React 19](https://react.dev/) (Utilizing latest hooks and concurrency)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing for robustness)
*   **Build Tool**: [Vite](https://vitejs.dev/) (Blazing fast HMR and bundling)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Typography Plugin (Glassmorphism & Cyberpunk aesthetic)
*   **AI Engine**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
    *   *Models Used*: `gemini-3-flash`, `gemini-2.5-flash-latest`, `gemini-2.5-flash-image`, `gemini-2.5-flash-preview-tts`.
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **PWA**: Service Workers for offline capabilities and "Add to Home Screen" support.

---

## 🛠️ Installation & Setup

Follow these steps to deploy your own instance of Saqib AI Studio.

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Cloud Project with Gemini API enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/saqib-ai-studio.git
cd saqib-ai-studio
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment
Create a `.env` file in the root directory. You **MUST** get an API key from [Google AI Studio](https://aistudio.google.com/).

```env
# Essential for all AI features
API_KEY=AIzaSy...Your_Google_API_Key_Here
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Build for Production
```bash
npm run build
```
The output will be in the `dist` folder, ready for Netlify, Vercel, or any static host.

---

## 📱 Progressive Web App (PWA)

Saqib AI Studio is fully PWA compliant.

*   **Mobile**: Open in Chrome/Safari -> Tap "Share" -> "Add to Home Screen". It behaves like a native app without an address bar.
*   **Desktop**: Click the install icon in the Chrome address bar to install as a desktop application.
*   **Offline**: Caches critical assets for faster loading and basic offline functionality.

---

## 🔒 Security Note

*   **Client-Side AI**: This app connects directly to Google's API from the client side. While safe for personal use, in a production environment with public users, you should proxy requests through a backend to protect your API Key.
*   **Code Execution**: The "Preview" feature runs generated code in a sandboxed iframe, but always exercise caution when executing AI-generated JavaScript.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🌟 Acknowledgements

*   **Google Gemini Team** for the incredible multimodal models.
*   **Mr. Saqib** for the vision, engineering, and UI design.
*   The open-source community for React, Vite, and Tailwind.

<br />
<div align="center">
  <p>Don't forget to give a ⭐ if you like this project!</p>
  
  <b>Developed with ❤️ & ☕ by Mr. Saqib</b>
  <br/>
  <sub><i>Educational & Research Purpose Only</i></sub>
</div>
