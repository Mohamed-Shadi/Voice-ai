import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is loaded
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key prefix:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

    const { message, history, userTimezone } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    console.log('Received message:', message);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get current date and time information
    const now = new Date();
    
    // Use user's timezone if provided, otherwise use server timezone
    const timeZone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const currentDateTime = {
      fullDate: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: timeZone
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: timeZone
      }),
      dayOfWeek: now.toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: timeZone
      }),
      date: now.toLocaleDateString('en-US', {
        timeZone: timeZone
      }),
      timeZone: timeZone,
      timestamp: now.toISOString()
    };

    // Build conversation context
    let conversationContext = `You are a helpful, friendly AI assistant. Keep your responses conversational and concise, as they will be spoken aloud. Aim for responses that are 1-3 sentences unless more detail is specifically requested.

CURRENT DATE AND TIME INFORMATION:
- Current date and time: ${currentDateTime.fullDate} at ${currentDateTime.time}
- Today is: ${currentDateTime.dayOfWeek}
- Short date: ${currentDateTime.date}
- Time: ${currentDateTime.time}
- Time zone: ${currentDateTime.timeZone}

When users ask about the current date, time, or day, use the information provided above. Always provide the current information accurately.

`;

    // Add conversation history for context
    if (history && Array.isArray(history)) {
      conversationContext += 'Previous conversation:\n';
      history.forEach((msg: Message) => {
        conversationContext += `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}\n`;
      });
      conversationContext += '\n';
    }

    // Add the current message
    conversationContext += `User: ${message}\nAssistant:`;

    console.log('Sending to Gemini...');

    // Get response from Gemini
    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response received:', text.substring(0, 100) + '...');

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Chat error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: 'Failed to get AI response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
