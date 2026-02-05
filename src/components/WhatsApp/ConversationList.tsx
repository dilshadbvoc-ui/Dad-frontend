import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../contexts/useSocket';

interface Conversation {
    phoneNumber: string;
    displayName: string;
    lastMessage?: string | { text?: string, templateName?: string };
    lastMessageAt: string;
    messageType: string;
    unreadCount?: number;
}

interface ConversationListProps {
    onSelectConversation: (phone: string) => void;
    selectedPhone: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, selectedPhone }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { socket } = useSocket();

    const fetchConversations = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const response = await api.get('/whatsapp/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations(true);

        // Polling as a fallback (longer interval)
        const interval = setInterval(() => fetchConversations(false), 60000);

        // Socket listener
        if (socket) {
            const handleNewMessage = (data: { message: { content: string, sentAt?: string, createdAt?: string, messageType: string }, phoneNumber: string }) => {

                setConversations(prev => {
                    const existingIdx = prev.findIndex(c => c.phoneNumber === data.phoneNumber);

                    if (existingIdx > -1) {
                        // Update existing conversation
                        const updated = [...prev];
                        const conversation = { ...updated[existingIdx] };

                        conversation.lastMessage = data.message.content;
                        conversation.lastMessageAt = data.message.sentAt || data.message.createdAt || new Date().toISOString();
                        conversation.messageType = data.message.messageType;

                        updated.splice(existingIdx, 1);
                        return [conversation, ...updated];
                    } else {
                        // New conversation (refresh the whole list to get display name etc.)
                        fetchConversations(false);
                        return prev;
                    }
                });
            };

            socket.on('whatsapp_message_received', handleNewMessage);

            socket.on('whatsapp_conversation_read', (data: { phoneNumber: string }) => {
                setConversations(prev => prev.map(c => {
                    if (c.phoneNumber === data.phoneNumber) {
                        return { ...c, unreadCount: 0 };
                    }
                    return c;
                }));
            });

            return () => {
                clearInterval(interval);
                socket.off('whatsapp_message_received', handleNewMessage);
                socket.off('whatsapp_conversation_read');
            };
        }

        return () => clearInterval(interval);
    }, [socket, fetchConversations]);

    const filteredConversations = conversations.filter(c =>
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNumber.includes(search)
    );

    const getMessagePreview = (conv: Conversation) => {
        if (!conv.lastMessage) return 'No content';
        if (typeof conv.lastMessage === 'string') return conv.lastMessage;

        const lastMsg = conv.lastMessage;
        if (conv.messageType === 'text') return lastMsg.text || 'Text message';
        if (conv.messageType === 'image') return '📷 Image';
        if (conv.messageType === 'document') return '📄 Document';
        if (conv.messageType === 'audio') return '🎤 Audio';
        if (conv.messageType === 'video') return '🎥 Video';
        if (conv.messageType === 'template') return `📋 Template: ${lastMsg.templateName}`;
        return 'Message';
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1b4b]">
            <div className="p-3 bg-[#1e1b4b] border-b border-indigo-900/50">
                <input
                    type="text"
                    placeholder="Search chats..."
                    className="w-full px-4 py-2 bg-indigo-950/50 border border-indigo-900/50 rounded-lg text-sm text-white placeholder:text-indigo-400/50 focus:ring-2 focus:ring-indigo-500 focus:bg-indigo-900/50 outline-none transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-12 h-12 bg-indigo-950/50 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-indigo-950/50 rounded w-1/2"></div>
                                    <div className="h-3 bg-indigo-950/50 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p>No conversations found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-indigo-900/30">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.phoneNumber}
                                onClick={() => onSelectConversation(conv.phoneNumber)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-white/5 ${selectedPhone === conv.phoneNumber ? 'bg-indigo-500/20 shadow-inner' : ''
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-lg">
                                        {conv.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online indicator could go here */}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedPhone === conv.phoneNumber ? 'text-indigo-200' : 'text-white'}`}>
                                            {conv.displayName}
                                        </h3>
                                        {conv.lastMessageAt && (
                                            <span className={`text-[10px] shrink-0 font-medium ${conv.unreadCount && conv.unreadCount > 0 ? 'text-indigo-400' : 'text-indigo-300/40'}`}>
                                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <p className={`text-xs truncate flex-1 leading-relaxed ${conv.unreadCount && conv.unreadCount > 0 ? 'text-indigo-100 font-semibold' : 'text-indigo-300/60'}`}>
                                            {getMessagePreview(conv)}
                                        </p>
                                        {conv.unreadCount && conv.unreadCount > 0 ? (
                                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-indigo-500/30">
                                                {conv.unreadCount}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
