"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceAssistant = () => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Refs for managing speech recognition
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        handleSpeechResult(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  // Function to start listening
  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Error starting voice recognition. Please try again.');
      }
    } else {
      alert('Speech recognition is not supported in your browser. Please use the text input instead.');
    }
  };

  // Function to stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Function to handle speech recognition result
  const handleSpeechResult = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        text: transcript,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Get AI response
      const aiResponse = await getAIResponse(transcript);
      
      // Add AI message to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Convert AI response to speech
      await speakText(aiResponse);
    } catch (error) {
      console.error('Error processing speech:', error);
      alert('Error processing your voice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to get AI response
  const getAIResponse = async (text: string): Promise<string> => {
    // Get last 3 messages for context (conversation memory)
    const recentMessages = messages.slice(-10); // Last 3 exchanges (6 messages)
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text,
        history: recentMessages 
      }),
    });

    if (!response.ok) {
      throw new Error('AI response failed');
    }

    const data = await response.json();
    return data.response;
  };

  // Function to convert text to speech using Web Speech API
  const speakText = async (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  // Function to handle text input
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: textInput,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setTextInput('');
      
      // Get AI response
      const aiResponse = await getAIResponse(textInput);
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      await speakText(aiResponse);
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Voice Assistant Logo" 
            className="mx-auto mb-4 w-100 h-30 object-contain"/>
          {!speechSupported && (
            <p className="text-red-500 text-sm mt-2">
              ⚠️ Speech recognition not supported in this browser. Please use text input.
            </p>
          )}
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto mb-6 p-4 bg-gray-50 rounded-xl">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <p>👋 Hi! I'm your voice AI assistant.</p>
                <p>Click the microphone to start talking or type your message below.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                      message.isUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Voice Controls */}
          <div className="flex justify-center mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || !speechSupported}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              } ${isProcessing || !speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center mb-6">
            {isListening && (
              <p className="text-red-500 font-medium">🎤 Listening... Click to stop</p>
            )}
            {isProcessing && (
              <p className="text-blue-500 font-medium">🤔 Processing your request...</p>
            )}
            {isPlaying && (
              <p className="text-green-500 font-medium">🔊 Playing response...</p>
            )}
          </div>

          {/* Text Input */}
          <div className="flex gap-2 pccolor">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Or your message here..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleTextSubmit}
              disabled={isProcessing || !textInput.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💡 Tip: Make sure your microphone is enabled for the best experience</p>
          <p>🌐 Voice recognition works best in Chrome, Edge, and Safari</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;