import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { format } from 'date-fns';

interface Message {
    id: string;
    direction: 'incoming' | 'outgoing';
    messageType: string;
    content: any;
    status: string;
    createdAt: string;
}

interface ChatWindowProps {
    phoneNumber: string;
    onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ phoneNumber, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/whatsapp/messages', {
                params: { phoneNumber, limit: 50 }
            });
            // Reverse so oldest is top
            setMessages(response.data.reverse());
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setLoading(true);
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [phoneNumber]);

    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            // Optimistic update
            const tempMessage: Message = {
                id: 'temp-' + Date.now(),
                direction: 'outgoing',
                messageType: 'text',
                content: { text: newMessage },
                status: 'sending',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');

            await api.post('/whatsapp/send', {
                to: phoneNumber,
                message: newMessage,
                type: 'text'
            });

            // Refresh to get real message status
            fetchMessages();
        } catch (error) {
            console.error('Failed to send message', error);
            // Could show error toast here
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* Header */}
            <div className="bg-gray-100 p-3 px-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{phoneNumber}</h3>
                        <span className="text-xs text-green-600 block leading-tight">WhatsApp</span>
                    </div>
                </div>
                <div>
                    {/* Actions like Call, info etc */}
                </div>
            </div>

            {/* Messages Area - Background pattern could be added here */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2 bg-opacity-10 bg-repeat bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center mt-10">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                    </div>
                ) : messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex w-full ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-2.5 px-3 shadow-sm relative ${msg.direction === 'outgoing'
                                ? 'bg-[#d9fdd3] rounded-tr-none'
                                : 'bg-white rounded-tl-none'
                                }`}
                        >
                            {/* Message Content */}
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                                {msg.messageType === 'text' && (msg.content?.text || '')}
                                {msg.messageType === 'template' && (
                                    <div className="italic text-gray-600">
                                        Template: {msg.content?.templateName}
                                    </div>
                                )}
                                {msg.messageType === 'image' && (
                                    <div className="text-gray-500 italic flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                        Image (Media ID: {msg.content?.mediaId})
                                    </div>
                                )}
                            </div>

                            {/* Metadata (Time & Status) */}
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500 min-w-[50px] text-right">
                                    {format(new Date(msg.createdAt), 'p')}
                                </span>
                                {msg.direction === 'outgoing' && (
                                    <span>
                                        {msg.status === 'sent' && <span className="text-gray-400 text-[10px]">✓</span>}
                                        {msg.status === 'delivered' && <span className="text-gray-400 text-[10px]">✓✓</span>}
                                        {msg.status === 'read' && <span className="text-blue-500 text-[10px]">✓✓</span>}
                                        {(msg.status === 'failed' || msg.status === 'sending') && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${msg.status === 'failed' ? 'text-red-500' : 'text-gray-300'}`}>
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="bg-white p-3 px-4 border-t border-gray-200 flex gap-2 items-end">
                <button type="button" className="p-2 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-100 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 p-2">
                    <textarea
                        className="w-full max-h-32 min-h-[40px] border-none outline-none resize-none text-sm"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        rows={1}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-1 transition-colors"
                >
                    {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
