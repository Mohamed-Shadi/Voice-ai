# Voice AI Assistant - Web App

### This is a voice-based AI assistant built with Next.js that allows users to interact via voice or text. The assistant listens to user input, processes it using Google's Gemini LLM API, and responds back through text-to-speech.

The app is responsive, browser-friendly, and supports both male and female voice responses with a live test feature.

<br />

## Features
🎤 Voice input using browser microphone

📝 Speech-to-text conversion using browser’s SpeechRecognition API

🤖 AI-powered responses via Google Gemini API

🗣️ Text-to-speech response using browser’s SpeechSynthesis API

💬 Conversation memory (Bonus)

🧑‍🔧 Voice selection (male/female) with test voice option (Bonus)

📱 Mobile responsive design (Bonus)

✍️ Option to type text messages if microphone is not available

🕒 Timestamps for each message

<br />

## Tech Stack
Frontend: Next.js (React)

Speech Recognition: Browser API (webkitSpeechRecognition)

LLM: Google Gemini API

Text-to-Speech: Browser SpeechSynthesis API

<br />

## Setup Instructions
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/voice-ai-assistant.git
   cd voice-ai-assistant
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env.local file in the project root and add your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Run the development server:
    ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.

<br />

## Live Demo
### The app is deployed and accessible here: https://voiceai-ten.vercel.app

<br />

## Notes
- Voice recognition works best in Google Chrome, Microsoft Edge, and Safari.
- For mobile users, the UI is fully responsive.
- Browser permissions for microphone and audio playback are required.

## Demo Video:
<video src="voiceai demo.mp4" width="320" height="240" controls></video>
