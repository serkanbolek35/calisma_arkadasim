import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, BookOpen, MapPin, Trash2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserChats } from '../../services/chat.service';
import { doc, deleteDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ChatsListPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadChats = () => {
    if (!currentUser) return;
    getUserChats(currentUser.uid)
      .then(setChats)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadChats(); }, [currentUser]);

  const handleDelete = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Bu sohbeti silmek istediğine emin misin?')) return;
    setDeleting(chatId);
    try {
      // Alt koleksiyon mesajlarını sil
      const msgsSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
      await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref)));
      // Sohbeti sil
      await deleteDoc(doc(db, 'chats', chatId));
      setChats(prev => prev.filter(c => c.id !== chatId));
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  };

  return (
    <AppLayout title="Sohbetler">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-cream">Sohbetler</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>Kabul ettiğin çalışma istekleri</p>
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
          <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>Çalışma isteklerinden birini kabul edince sohbet başlar.</p>
          <button onClick={() => navigate('/istekler')} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
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
              <div key={chat.id} className="glass-card flex items-center gap-4 hover:border-white/15 transition-all"
                style={{ padding: '0' }}>
                {/* Tıklanabilir alan */}
                <button onClick={() => navigate(`/sohbet/${chat.id}`)}
                  className="flex items-center gap-4 flex-1 text-left p-4 min-w-0">
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
                      {chat.subject && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                          <BookOpen size={11} /> {chat.subject}
                        </span>
                      )}
                      {chat.location && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--mist)' }}>
                          <MapPin size={11} /> {chat.location}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-xs mt-1 truncate" style={{ color: 'rgba(138,154,170,0.7)' }}>{chat.lastMessage}</p>
                    )}
                  </div>
                </button>

                {/* Sil butonu */}
                <button onClick={(e) => handleDelete(e, chat.id)}
                  disabled={deleting === chat.id}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mr-3 transition-all"
                  style={{ background: 'rgba(200,64,64,0.08)', border: '1px solid rgba(200,64,64,0.15)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,64,64,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,64,64,0.08)'}>
                  {deleting === chat.id
                    ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#E87070', borderTopColor: 'transparent' }} />
                    : <Trash2 size={14} style={{ color: '#E87070' }} />
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
