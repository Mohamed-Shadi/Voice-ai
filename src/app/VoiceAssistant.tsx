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
      const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('female');
      const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

      // Refs for managing speech recognition
      const recognitionRef = useRef<any>(null);

      // Initialize speech recognition and voices
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

        // Load available voices
        loadVoices();
      }, []);

      // Load available voices from the browser
      const loadVoices = () => {
        if ('speechSynthesis' in window) {
          const voices = speechSynthesis.getVoices();
          setAvailableVoices(voices);
          
          // If voices are not loaded yet, wait for them
          if (voices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
              setAvailableVoices(speechSynthesis.getVoices());
            };
          }
        }
      };

      // Get the best voice for the selected gender with simplified logic
      const getVoiceForGender = (gender: 'male' | 'female'): SpeechSynthesisVoice | null => {
        if (availableVoices.length === 0) return null;
        
        // Simple and reliable voice selection
        const voices = availableVoices.filter(voice => 
          voice.lang.startsWith('en') || voice.lang === 'en-US' || voice.lang === 'en-GB'
        );
        
        const voicesToSearch = voices.length > 0 ? voices : availableVoices;
        
        if (gender === 'female') {
          // Common female voice patterns across all devices
          const femaleVoice = voicesToSearch.find(voice => {
            const name = voice.name.toLowerCase();
            return name.includes('female') || 
                  name.includes('samantha') || 
                  name.includes('karen') || 
                  name.includes('victoria') || 
                  name.includes('zoe') || 
                  name.includes('allison') || 
                  name.includes('susan') || 
                  name.includes('kate') ||
                  name.includes('salli') ||
                  name.includes('joanna') ||
                  name.includes('amy') ||
                  name.includes('emma') ||
                  name.includes('google') && !name.includes('male');
          });
          
          if (femaleVoice) return femaleVoice;
        } else {
          // Common male voice patterns across all devices
          const maleVoice = voicesToSearch.find(voice => {
            const name = voice.name.toLowerCase();
            return name.includes('male') || 
                  name.includes('alex') || 
                  name.includes('daniel') || 
                  name.includes('david') || 
                  name.includes('fred') || 
                  name.includes('thomas') || 
                  name.includes('oliver') ||
                  name.includes('matthew') ||
                  name.includes('justin') ||
                  name.includes('mark') ||
                  name.includes('google us-english') ||
                  name.includes('microsoft david');
          });
          
          if (maleVoice) return maleVoice;
        }
        
        // Fallback logic
        const defaultVoice = voicesToSearch.find(voice => {
          if (gender === 'male') {
            // For male, prefer voices that are more likely to be male
            return voice.name.toLowerCase().includes('default') || 
                  voice.name === 'Google US English' ||
                  !voice.name.toLowerCase().includes('female');
          } else {
            // For female, use any available voice as fallback
            return true;
          }
        });
        
        return defaultVoice || voicesToSearch[0] || null;
      };

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
        // Get last 10 messages for context (conversation memory)
        const recentMessages = messages.slice(-10);
        
        // Get user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: text,
            history: recentMessages,
            userTimezone: userTimezone 
          }),
        });

        if (!response.ok) {
          throw new Error('AI response failed');
        }

        const data = await response.json();
        return data.response;
      };

      // Function to convert text to speech with simplified voice selection
      const speakText = async (text: string) => {
        if ('speechSynthesis' in window) {
          setIsPlaying(true);
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;
          
          // Set the voice based on selection
          const voice = getVoiceForGender(selectedVoice);
          if (voice) {
            utterance.voice = voice;
            console.log(`Using ${selectedVoice} voice:`, voice.name);
          }
          
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

      // Function to test the selected voice
      const testVoice = () => {
        const testText = `Hello! This is the ${selectedVoice} voice speaking`;
        speakText(testText);
      };

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <img 
                src="/logo.png" 
                alt="Voice Assistant Logo" 
                className="mx-auto mb-4 w-100 h-30 object-contain"
              />
              {!speechSupported && (
                <p className="text-red-500 text-sm mt-2">
                  ⚠️ Speech recognition not supported in this browser. Please use text input.
                </p>
              )}
            </div>

            {/* Main Interface */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Simple Voice Selection */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4 Small-Mob">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Choose Voice
                  </h3>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedVoice('female')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedVoice === 'female'
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Female
                    </button>
                    
                    <button
                      onClick={() => setSelectedVoice('male')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedVoice === 'male'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Male
                    </button>
                    
                    <button
                      onClick={testVoice}
                      disabled={isPlaying}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isPlaying ? 'Testing...' : 'Test Voice'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto mb-6 p-4 bg-gray-50 rounded-xl">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">👋Hi! I'm your AI assistant.</p>
                    <p className="mt-2">Click the microphone to start talking or type your message below.</p>
                    <p className="text-sm mt-2">Choose your preferred voice above!</p>
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
                  } ${isProcessing || !speechSupported ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
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
                  <p className="text-red-500 font-medium">Listening... Click to stop</p>
                )}
                {isProcessing && (
                  <p className="text-blue-500 font-medium">Processing your request...</p>
                )}
                {isPlaying && (
                  <p className="text-green-500 font-medium">Playing response...</p>
                )}
              </div>

              {/* Text Input */}
              <div className="flex gap-2 Small-Mob">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder="Or type your message here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={isProcessing || !textInput.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
              <p>🎵 Switch between male and female voices anytime</p>
            </div>
          </div>
        </div>
      );
    };

    export default VoiceAssistant;
