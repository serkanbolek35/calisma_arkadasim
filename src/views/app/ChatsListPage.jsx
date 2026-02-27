import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, BookOpen, MapPin, Clock } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserChats } from '../../services/chat.service';

export default function ChatsListPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getUserChats(currentUser.uid)
      .then(setChats)
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <AppLayout title="Sohbetler">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-cream">Sohbetler</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            Kabul ettiğin çalışma istekleri
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : chats.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-display text-xl font-semibold text-cream mb-2">Henüz sohbet yok</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>
            Çalışma isteklerinden birini kabul edince sohbet başlar.
          </p>
          <button onClick={() => navigate('/istekler')}
            className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
            <MessageCircle size={15} /> İsteklere Bak
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {chats.map(chat => {
            const partnerName = Object.entries(chat.participantNames || {})
              .find(([id]) => id !== currentUser.uid)?.[1] || 'Kullanıcı';
            const lastMsgTime = chat.lastMessageAt?.toDate?.() ?? chat.createdAt?.toDate?.() ?? new Date();

            return (
              <button key={chat.id} onClick={() => navigate(`/sohbet/${chat.id}`)}
                className="glass-card p-4 flex items-center gap-4 text-left w-full hover:border-white/15 transition-all">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-cream truncate">{partnerName}</p>
                    <p className="text-xs flex-shrink-0" style={{ color: 'var(--mist)' }}>
                      {lastMsgTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                      <BookOpen size={11} /> {chat.subject}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                      <MapPin size={11} /> {chat.location}
                    </span>
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'rgba(138,154,170,0.7)' }}>
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
                <MessageCircle size={16} className="flex-shrink-0" style={{ color: 'var(--amber)' }} />
              </button>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
