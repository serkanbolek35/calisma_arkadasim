import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MapPin, Clock, BookOpen } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getChat, listenMessages, sendMessage } from '../../services/chat.service';

export default function ChatPage() {
  const { chatId } = useParams();
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Sohbet bilgisini yükle
    getChat(chatId).then(c => {
      if (!c || !c.participants?.includes(currentUser.uid)) {
        navigate('/sohbetler');
        return;
      }
      setChat(c);
      setLoading(false);
    });

    // Mesajları gerçek zamanlı dinle
    const unsub = listenMessages(chatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => unsub();
  }, [chatId, currentUser]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const senderName = userDoc?.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı';
    await sendMessage(chatId, currentUser.uid, senderName, text);
    setText('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const partnerName = chat
    ? Object.entries(chat.participantNames || {}).find(([id]) => id !== currentUser.uid)?.[1] || 'Kullanıcı'
    : '';

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  if (loading) return (
    <AppLayout title="Sohbet">
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="">
      <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-48px)]">

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b mb-4 flex-shrink-0"
          style={{ borderColor: 'rgba(245,237,216,0.08)' }}>
          <button onClick={() => navigate('/sohbetler')}
            className="p-2 rounded-xl glass-card hover:border-white/15 transition-all">
            <ArrowLeft size={16} className="text-cream/60" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-cream">{partnerName}</p>
            {chat && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                  <BookOpen size={11} /> {chat.subject}
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                  <MapPin size={11} /> {chat.location}
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                  <Clock size={11} /> {chat.date ? new Date(chat.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''} {chat.timeSlot}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="text-4xl mb-4">💬</div>
              <p className="font-display text-lg font-semibold text-cream mb-2">Sohbet başladı!</p>
              <p className="text-sm" style={{ color: 'var(--mist)' }}>
                {partnerName} ile ders planınızı konuşabilirsiniz.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.uid;
            const prevMsg = messages[i - 1];
            const showDate = !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(245,237,216,0.08)' }} />
                    <span className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--mist)' }}>
                      {formatDate(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(245,237,216,0.08)' }} />
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <p className="text-xs px-1" style={{ color: 'var(--mist)' }}>{msg.senderName}</p>
                    )}
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isMe ? 'var(--amber)' : 'rgba(245,237,216,0.08)',
                        color: isMe ? 'var(--ink)' : 'var(--cream)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.text}
                    </div>
                    <p className="text-xs px-1" style={{ color: 'rgba(138,154,170,0.6)' }}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Mesaj kutusu */}
        <div className="flex-shrink-0 pt-3 border-t" style={{ borderColor: 'rgba(245,237,216,0.08)' }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesaj yaz... (Enter ile gönder)"
              rows={1}
              className="flex-1 input-field resize-none"
              style={{
                background: 'rgba(245,237,216,0.06)',
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <button onClick={handleSend} disabled={!text.trim() || sending}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: 'var(--amber)' }}>
              {sending
                ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                : <Send size={16} style={{ color: 'var(--ink)' }} />
              }
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'rgba(138,154,170,0.5)' }}>
            Enter ile gönder · Shift+Enter yeni satır
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
