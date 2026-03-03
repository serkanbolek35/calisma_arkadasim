import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, CheckCircle2, XCircle, RefreshCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMatches, sendMatchRequest, respondToMatch, endMatch } from '../../services/matching.service';
import { getUser } from '../../services/user.service';
import { isRecentlyActive } from '../../services/presence.service';
import { collection, onSnapshot, query, where, doc, addDoc, updateDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MARMARA_KAMPUSLER } from '../../data/marmara';

// ── Harita ─────────────────────────────────────────────────────
const MatchMap = ({ lat, lng, potentials, onSelectUser }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selfMarkerRef = useRef(null);
  const potMarkersRef = useRef([]);

  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [lat || 40.9872, lng || 29.0524], zoom: 13 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
    }).addTo(map);
    MARMARA_KAMPUSLER.forEach(k => {
      const icon = L.divIcon({
        html: `<div style="width:10px;height:10px;border-radius:50%;background:rgba(90,122,90,0.7);border:2px solid #5A7A5A"></div>`,
        className: '', iconAnchor: [5, 5],
      });
      L.marker([k.lat, k.lng], { icon }).addTo(map).bindPopup(`🏫 ${k.ad}`);
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L; const map = mapInstanceRef.current;
    if (!L || !map || !lat || !lng) return;
    if (selfMarkerRef.current) selfMarkerRef.current.remove();
    const icon = L.divIcon({
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#E8A020;border:3px solid white;box-shadow:0 0 0 5px rgba(232,160,32,0.25),0 0 20px rgba(232,160,32,0.5)"></div>`,
      className: '', iconAnchor: [10, 10],
    });
    selfMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
      .addTo(map).bindPopup('<b>📍 Senin Konumun</b>');
    map.setView([lat, lng], 13);
  }, [lat, lng]);

  useEffect(() => {
    const L = window.L; const map = mapInstanceRef.current;
    if (!L || !map) return;
    potMarkersRef.current.forEach(m => m.remove());
    potMarkersRef.current = [];

    potentials.forEach(user => {
      if (!user.campusLat || !user.campusLng) return;
      const jLat = user.campusLat + (Math.random() - 0.5) * 0.001;
      const jLng = user.campusLng + (Math.random() - 0.5) * 0.001;
      const score = user.compatibilityScore || 0;
      const color = score >= 70 ? '#E8A020' : '#7A9E7A';
      const onlineDot = user.isOnline
        ? `<div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#5ABF8A;border:2px solid #0D0D0D"></div>`
        : '';
      const icon = L.divIcon({
        html: `<div style="width:38px;height:38px;border-radius:50%;background:${color}20;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:700;font-size:15px;color:${color};box-shadow:0 2px 8px rgba(0,0,0,0.4);position:relative">
          ${user.displayName?.charAt(0)?.toUpperCase() || '?'}${onlineDot}</div>`,
        className: '', iconAnchor: [19, 19],
      });
      const marker = L.marker([jLat, jLng], { icon }).addTo(map);
      marker.on('click', () => { map.closePopup(); onSelectUser(user); });
      potMarkersRef.current.push(marker);
    });
  }, [potentials]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }} />;
};

// ── Modal — React Portal ile map dışına render edilir ──────────
const UserModal = ({ user, sending, onViewProfile, onSendRequest, onClose }) => {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)',
        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '360px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(232,160,32,0.15)', color: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: '700',
          }}>
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--cream)', marginBottom: '4px' }}>
              {user.displayName}
            </h3>
            {user.campusName && (
              <p style={{ fontSize: '13px', color: 'var(--mist)' }}>📍 {user.campusName}</p>
            )}
            {user.faculty && (
              <p style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '2px' }}>{user.faculty}</p>
            )}
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--mist)' }}>Uyum Skoru</span>
              <span style={{ color: 'var(--amber)' }}>%{user.compatibilityScore}</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(245,237,216,0.1)' }}>
              <div style={{ height: '100%', borderRadius: '4px', width: `${user.compatibilityScore}%`, background: 'var(--amber)' }} />
            </div>
          </div>

          {user.commonSubjects?.length > 0 && (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '8px' }}>Ortak dersler:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {user.commonSubjects.map(s => (
                  <span key={s} style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                    background: 'rgba(232,160,32,0.1)', color: 'var(--amber)',
                    border: '1px solid rgba(232,160,32,0.2)',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onViewProfile} className="btn-outline" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <User size={15} /> Profili Görüntüle
          </button>
          <button onClick={onSendRequest} disabled={sending} className="btn-primary" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {sending
              ? <span style={{ width: '16px', height: '16px', border: '2px solid var(--ink)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              : <><UserPlus size={15} /> Eşleşme İsteği Gönder</>
            }
          </button>
          <button onClick={onClose} className="btn-outline" style={{ width: '100%', padding: '10px' }}>
            İptal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function MatchesPage() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('map');
  const [matches, setMatches] = useState([]);
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [matchPartnerNames, setMatchPartnerNames] = useState({});

  // Gerçek zamanlı kullanıcı listener
  useEffect(() => {
    if (!currentUser) return;

    const mySubjects = userDoc?.subjects || userDoc?.preferences?.subjects || [];
    const savedLat = userDoc?.campusLat || userDoc?.preferences?.campusLat;
    const savedLng = userDoc?.campusLng || userDoc?.preferences?.campusLng;
    if (savedLat && savedLng && !userLat) { setUserLat(savedLat); setUserLng(savedLng); }

    // GPS al
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocationStatus('ok'); },
        () => setLocationStatus('denied'),
        { timeout: 8000 }
      );
    } else { setLocationStatus('denied'); }

    // Eşleşmeleri gerçek zamanlı dinle (chatId güncellenince anında güncellenir)
    const matchUnsub = onSnapshot(
      query(collection(db, 'matches'), where('users', 'array-contains', currentUser.uid)),
      (matchSnap) => {
        const m = matchSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.status !== 'ended');
        setMatches(m);
      }
    );

    // Kullanıcıları gerçek zamanlı dinle
    const unsub = onSnapshot(collection(db, 'users'), async (snap) => {
      const allUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

      // Eşleşmeleri al (matchUnsub zaten gerçek zamanlı günceller)
      const m = matches;
      const sentOrActiveIds = m.map(x => x.users?.find(id => id !== currentUser.uid)).filter(Boolean);

      // Partner isimlerini güncelle
      const names = {};
      for (const match of m) {
        const pid = match.users?.find(id => id !== currentUser.uid);
        if (pid) {
          const p = allUsers.find(u => u.uid === pid);
          if (p) names[pid] = p.displayName || 'Kullanıcı';
        }
      }
      setMatchPartnerNames(names);

      // Potansiyel eşleşmeleri filtrele — ANLIK aktiflik kontrolü
      const potList = [];
      for (const u of allUsers) {
        if (u.uid === currentUser.uid) continue;
        if (sentOrActiveIds.includes(u.uid)) continue;
        if (!isRecentlyActive(u.lastSeen, u.isOnline)) continue; // 30 dk / offline kontrolü

        const theirSubjects = u.subjects || u.preferences?.subjects || [];
        let common = [], score = 50;
        if (mySubjects.length > 0 && theirSubjects.length > 0) {
          common = mySubjects.filter(s => theirSubjects.includes(s));
          if (common.length === 0) continue;
          score = Math.round((common.length / Math.max(mySubjects.length, theirSubjects.length, 1)) * 100);
        }

        const campusLat = u.activeLat || u.campusLat || u.preferences?.campusLat || null;
        const campusLng = u.activeLng || u.campusLng || u.preferences?.campusLng || null;

        potList.push({
          uid: u.uid,
          displayName: u.displayName || 'Kullanıcı',
          campusLat, campusLng,
          campusName: u.campusName || u.preferences?.campus || '',
          faculty: u.faculty || '',
          subjects: theirSubjects,
          commonSubjects: common,
          compatibilityScore: score,
          isOnline: u.isOnline || false,
        });
      }
      setPotentials(potList.sort((a, b) => b.compatibilityScore - a.compatibilityScore));
      setLoading(false);
    });

    return () => { unsub(); matchUnsub(); };
  }, [currentUser, userDoc]);

  const handleOpenChat = async (match) => {
    try {
      // chatId zaten varsa direkt git
      if (match.chatId) {
        navigate(`/sohbet/${match.chatId}`);
        return;
      }

      const [uid1, uid2] = match.users;
      const [u1Snap, u2Snap] = await Promise.all([
        getDoc(doc(db, 'users', uid1)),
        getDoc(doc(db, 'users', uid2)),
      ]);

      // Direkt yeni sohbet oluştur
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [uid1, uid2],
        participantNames: {
          [uid1]: u1Snap.data()?.displayName || 'Kullanıcı',
          [uid2]: u2Snap.data()?.displayName || 'Kullanıcı',
        },
        matchId: match.id,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageAt: null,
      });

      // Match'e chatId yaz
      await updateDoc(doc(db, 'matches', match.id), { chatId: chatRef.id });
      navigate(`/sohbet/${chatRef.id}`);
    } catch (e) {
      console.error('handleOpenChat error:', e);
    }
  };

  const handleSendRequest = async (toUser) => {
    setSending(true);
    try {
      const fromName = userDoc?.displayName || currentUser?.email?.split('@')[0] || 'Kullanıcı';
      await sendMatchRequest(currentUser.uid, toUser.uid, toUser.commonSubjects || [], toUser.compatibilityScore || 0, fromName);
      setSelectedUser(null);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleRespond = async (matchId, accept) => {
    const name = userDoc?.displayName || currentUser?.email?.split('@')[0] || 'Kullanıcı';
    await respondToMatch(matchId, accept, currentUser.uid, name);
  };

  const handleEnd = async (matchId) => { await endMatch(matchId); };

  const activeMatches = matches.filter(m => m.status === 'active');
  const incoming = matches.filter(m => m.status === 'pending' && m.initiatedBy !== currentUser?.uid);
  const sent = matches.filter(m => m.status === 'pending' && m.initiatedBy === currentUser?.uid);
  const mapLat = userLat || userDoc?.campusLat || 40.9872;
  const mapLng = userLng || userDoc?.campusLng || 29.0524;

  const tabs = [
    { id: 'map', label: '🗺 Harita' },
    { id: 'list', label: '👥 Liste', count: potentials.length },
    { id: 'requests', label: '📬 İstekler', count: incoming.length || null },
  ];

  return (
    <AppLayout title="Eşleşmeler">
      {/* Kullanıcı modal — React Portal ile document.body'e render edilir, haritanın üstünde kalır */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          sending={sending}
          onViewProfile={() => { navigate(`/profil/${selectedUser.uid}`); setSelectedUser(null); }}
          onSendRequest={() => handleSendRequest(selectedUser)}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: tab === t.id ? 'rgba(232,160,32,0.12)' : 'rgba(245,237,216,0.04)',
              color: tab === t.id ? 'var(--amber)' : 'var(--mist)',
              border: tab === t.id ? '1px solid rgba(232,160,32,0.25)' : '1px solid rgba(245,237,216,0.08)',
            }}>
            {t.label}
            {t.count > 0 && <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {activeMatches.length > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(58,138,90,0.08)', border: '1px solid rgba(58,138,90,0.2)' }}>
          <CheckCircle2 size={16} style={{ color: '#5ABF8A' }} />
          <p className="text-sm" style={{ color: '#5ABF8A' }}>{activeMatches.length} aktif eşleşmen var</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : (
        <>
          {tab === 'map' && (
            <div className="flex flex-col gap-3">
              {locationStatus === 'loading' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', color: 'var(--amber)' }}>
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Konum alınıyor...
                </div>
              )}
              {locationStatus === 'denied' && (
                <div className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(138,154,170,0.06)', border: '1px solid rgba(138,154,170,0.15)', color: 'var(--mist)' }}>
                  📍 Konum izni yok — kayıtlı kampüs konumun gösteriliyor
                </div>
              )}
              {potentials.length > 0 && (
                <div className="px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
                  style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.12)', color: 'var(--mist)' }}>
                  💡 <span><strong className="text-cream">{potentials.length} aktif öğrenci</strong> — tıkla, profil gör, istek gönder</span>
                </div>
              )}
              <div style={{ height: '450px' }}>
                <MatchMap lat={mapLat} lng={mapLng} potentials={potentials} onSelectUser={setSelectedUser} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--mist)' }}>
                {[['#E8A020','Sen'],['rgba(232,160,32,0.8)','%70+ uyum'],['rgba(122,158,122,0.8)','Diğerleri'],['#5ABF8A','Şu an online']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </div>
          )}

          {tab === 'list' && (
            potentials.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="font-display text-xl font-semibold text-cream mb-2">Şu an aktif öğrenci yok</h3>
                <p className="text-sm" style={{ color: 'var(--mist)' }}>Son 30 dakikada aktif olan öğrenciler burada görünür.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potentials.map((user, i) => (
                  <div key={i} className="glass-card p-5 flex flex-col gap-4 hover:border-white/15 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                          style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: '#5ABF8A', borderColor: 'var(--ink)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cream">{user.displayName}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--mist)' }}>📍 {user.campusName || 'Kampüs bilgisi yok'}</p>
                      </div>
                      <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color: 'var(--amber)' }}>%{user.compatibilityScore}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(245,237,216,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${user.compatibilityScore}%`, background: 'var(--amber)' }} />
                    </div>
                    {user.commonSubjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {user.commonSubjects.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/profil/${user.uid}`)}
                        className="btn-outline flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                        <User size={13} /> Profil
                      </button>
                      <button onClick={() => setSelectedUser(user)}
                        className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                        <UserPlus size={13} /> Eşleş
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'requests' && (
            <div className="flex flex-col gap-6">
              {incoming.length === 0 && sent.length === 0 && activeMatches.length === 0 ? (
                <div className="glass-card p-16 text-center">
                  <p className="text-4xl mb-4">📭</p>
                  <h3 className="font-display text-xl font-semibold text-cream mb-2">Bekleyen istek yok</h3>
                </div>
              ) : (
                <>
                  {incoming.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Gelen İstekler ({incoming.length})</p>
                      <div className="flex flex-col gap-3">
                        {incoming.map(m => {
                          const pid = m.users?.find(id => id !== currentUser?.uid);
                          const name = matchPartnerNames[pid] || 'Kullanıcı';
                          return (
                            <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                                style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-cream">{name}</p>
                                <p className="text-xs" style={{ color: 'var(--mist)' }}>%{m.compatibilityScore} uyum · {(m.commonSubjects||[]).slice(0,2).join(', ')}</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleRespond(m.id, true)} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"><CheckCircle2 size={13} /> Kabul</button>
                                <button onClick={() => handleRespond(m.id, false)} className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1"><XCircle size={13} /> Reddet</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {activeMatches.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Aktif Eşleşmeler ({activeMatches.length})</p>
                      <div className="flex flex-col gap-3">
                        {activeMatches.map(m => {
                          const pid = m.users?.find(id => id !== currentUser?.uid);
                          const name = matchPartnerNames[pid] || 'Kullanıcı';
                          return (
                            <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                                style={{ background: 'rgba(58,138,90,0.15)', color: '#5ABF8A' }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-cream">{name}</p>
                                <p className="text-xs" style={{ color: '#5ABF8A' }}>✓ Aktif</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => navigate(`/profil/${pid}`)} className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1"><User size={12} /> Profil</button>
                                <button onClick={() => handleOpenChat(m)} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">💬 Mesaj</button>
                                <button onClick={() => handleEnd(m.id)} className="px-3 py-1.5 text-xs rounded-lg" style={{ color: '#E87070', border: '1px solid rgba(200,64,64,0.3)' }}>Sonlandır</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {sent.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Gönderilen İstekler ({sent.length})</p>
                      <div className="flex flex-col gap-3">
                        {sent.map(m => {
                          const pid = m.users?.find(id => id !== currentUser?.uid);
                          const name = matchPartnerNames[pid] || 'Kullanıcı';
                          return (
                            <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                                style={{ background: 'rgba(138,154,170,0.1)', color: 'var(--mist)' }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-cream">{name}</p>
                                <p className="text-xs" style={{ color: 'var(--mist)' }}>⏳ Yanıt bekleniyor</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
