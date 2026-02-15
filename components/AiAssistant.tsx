import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, MessageSquareIcon } from './Icons';

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hi, I’m your AI HR Assistant. I can help draft job descriptions, emails, and answer questions. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiText = "Thanks for your input! In this Sprint 1 demo, I'm simulating responses. In future versions, I'll generate real content based on your hiring data.";
      
      if (text.toLowerCase().includes("job description")) {
        aiText = "Here is a draft structure for that job description:\n\n**Role Summary**\n[Brief overview]\n\n**Responsibilities**\n- [Task 1]\n- [Task 2]\n\n**Requirements**\n- [Skill 1]\n- [Skill 2]";
      } else if (text.toLowerCase().includes("email")) {
        aiText = "Draft Email:\n\nSubject: Interview Invitation\n\nHi [Name],\n\nWe'd love to invite you to an interview for the [Role] position at Cardio Guard. Please let us know your availability for next week.\n\nBest,\n[Your Name]";
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: aiText
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const quickPrompts = [
    "Draft a Senior Engineer JD",
    "Write an interview invite email",
    "Summarize hiring policies"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center">
        <div className="bg-indigo-100 p-2 rounded-full mr-3">
            <MessageSquareIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-gray-900">AI Assistant</h2>
            <p className="text-xs text-gray-500">Powered by Sprint 1 Logic</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] rounded-2xl px-5 py-3.5 text-sm shadow-sm whitespace-pre-wrap leading-relaxed
              ${msg.sender === 'user' 
                ? 'bg-red-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {messages.length < 3 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {quickPrompts.map(prompt => (
                    <button 
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-xs font-medium rounded-full border border-gray-200 transition-colors whitespace-nowrap"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        )}
        <form onSubmit={onSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            className="flex-1 pl-4 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm"
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;