import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
    phoneNumber: string;
    displayName: string;
    lastMessage: any;
    lastMessageAt: string;
    messageType: string;
}

interface ConversationListProps {
    onSelectConversation: (phone: string) => void;
    selectedPhone: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, selectedPhone }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchConversations = async () => {
        try {
            const response = await api.get('/whatsapp/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();

        // Poll for new messages every 30 seconds
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredConversations = conversations.filter(c =>
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNumber.includes(search)
    );

    const getMessagePreview = (conv: Conversation) => {
        if (!conv.lastMessage) return 'No content';
        if (conv.messageType === 'text') return conv.lastMessage.text || 'Text message';
        if (conv.messageType === 'image') return '📷 Image';
        if (conv.messageType === 'document') return '📄 Document';
        if (conv.messageType === 'audio') return '🎤 Audio';
        if (conv.messageType === 'video') return '🎥 Video';
        if (conv.messageType === 'template') return `📋 Template: ${conv.lastMessage.templateName}`;
        return 'Message';
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 bg-white border-b border-gray-100">
                <input
                    type="text"
                    placeholder="Search chats..."
                    className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p>No conversations found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.phoneNumber}
                                onClick={() => onSelectConversation(conv.phoneNumber)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedPhone === conv.phoneNumber ? 'bg-green-50 hover:bg-green-50 border-l-4 border-green-500' : 'border-l-4 border-transparent'
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-lg overflow-hidden shrink-0">
                                        {conv.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online indicator could go here */}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedPhone === conv.phoneNumber ? 'text-green-800' : 'text-gray-900'}`}>
                                            {conv.displayName}
                                        </h3>
                                        {conv.lastMessageAt && (
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {getMessagePreview(conv)}
                                    </p>
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
