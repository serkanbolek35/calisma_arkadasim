import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMatches, sendMatchRequest, respondToMatch, endMatch, findPotentialMatches } from '../../services/matching.service';
import { getUserPreferences } from '../../services/user.service';
import { MARMARA_KAMPUSLER } from '../../data/marmara';

// ── Harita ───────────────────────────────────────────────────
const MatchMap = ({ lat, lng, potentials, onSelectUser }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selfMarkerRef = useRef(null);
  const potentialMarkersRef = useRef([]);

  // Haritayı bir kez oluştur
  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [lat || 40.9872, lng || 29.0524],
      zoom: 13,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;

    // Kampüsler
    MARMARA_KAMPUSLER.forEach(k => {
      const icon = L.divIcon({
        html: `<div style="width:11px;height:11px;border-radius:50%;background:rgba(90,122,90,0.8);border:2px solid #5A7A5A"></div>`,
        className: '', iconAnchor: [5, 5],
      });
      L.marker([k.lat, k.lng], { icon }).addTo(map)
        .bindPopup(`<span style="font-size:12px;color:#0D0D0D">🏫 ${k.ad}</span>`);
    });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Kendi konumunu güncelle (lat/lng değiştiğinde)
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map || !lat || !lng) return;

    // Eski self marker'ı kaldır
    if (selfMarkerRef.current) { selfMarkerRef.current.remove(); selfMarkerRef.current = null; }

    const icon = L.divIcon({
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#E8A020;border:3px solid white;box-shadow:0 0 0 4px rgba(232,160,32,0.3),0 0 16px rgba(232,160,32,0.6)"></div>`,
      className: '', iconAnchor: [10, 10],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(map)
      .bindPopup('<b style="color:#0D0D0D">📍 Senin Konumun</b>');
    selfMarkerRef.current = marker;
    map.setView([lat, lng], 13);
  }, [lat, lng]);

  // Potansiyel kullanıcı markerları
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    potentialMarkersRef.current.forEach(m => m.remove());
    potentialMarkersRef.current = [];

    potentials.forEach(user => {
      const uLat = user.campusLat;
      const uLng = user.campusLng;
      if (!uLat || !uLng) return;
      const jLat = uLat + (Math.random() - 0.5) * 0.002;
      const jLng = uLng + (Math.random() - 0.5) * 0.002;
      const score = user.compatibilityScore || 0;
      const color = score >= 70 ? '#E8A020' : score >= 40 ? '#7A9E7A' : '#8A9AAA';
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:bold;font-size:13px;color:${color}">
          ${user.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>`,
        className: '', iconAnchor: [16, 16],
      });
      const marker = L.marker([jLat, jLng], { icon }).addTo(map)
        .bindPopup(`<div style="min-width:150px"><b style="font-size:13px">${user.displayName || 'Kullanıcı'}</b><br/>
          <span style="font-size:11px;color:#666">%${score} uyum · ${user.campusName || ''}</span><br/>
          <span style="font-size:11px;color:#444">${(user.commonSubjects||[]).slice(0,2).join(', ')}</span></div>`);
      marker.on('click', () => onSelectUser(user));
      potentialMarkersRef.current.push(marker);
    });
  }, [potentials]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }} />;
};

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function MatchesPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('map');
  const [matches, setMatches] = useState([]);
  const [potentials, setPotentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // loading | ok | denied

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [m, prefs] = await Promise.all([
        getMatches(currentUser.uid),
        getUserPreferences(currentUser.uid),
      ]);
      setMatches(m);

      // Kampüs konum fallback
      if (!userLat && prefs?.campusLat) {
        setUserLat(prefs.campusLat);
        setUserLng(prefs.campusLng);
        if (locationStatus === 'denied') setLocationStatus('ok');
      }

      const subjects = prefs?.subjects || [];
      const sentOrActiveIds = m.map(x => x.users?.find(id => id !== currentUser.uid)).filter(Boolean);
      const all = await findPotentialMatches(currentUser.uid, subjects, '');
      // İstek gönderilmiş veya aktif eşleşme olan kişileri filtrele
      setPotentials(all.filter(u => !sentOrActiveIds.includes(u.uid)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // GPS iste
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationStatus('ok');
        },
        () => setLocationStatus('denied'),
        { timeout: 8000 }
      );
    } else {
      setLocationStatus('denied');
    }
    loadData();
  }, [currentUser]);

  const handleSendRequest = async (toUser) => {
    setSending(true);
    try {
      await sendMatchRequest(currentUser.uid, toUser.uid, toUser.commonSubjects || [], toUser.compatibilityScore || 0);
      setSelectedUser(null);
      await loadData();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleRespond = async (matchId, accept) => {
    await respondToMatch(matchId, accept);
    await loadData();
  };

  const handleEnd = async (matchId) => {
    await endMatch(matchId);
    await loadData();
  };

  const activeMatches = matches.filter(m => m.status === 'active');
  const incoming = matches.filter(m => m.status === 'pending' && m.initiatedBy !== currentUser?.uid);
  const sent = matches.filter(m => m.status === 'pending' && m.initiatedBy === currentUser?.uid);

  const tabs = [
    { id: 'map', label: '🗺 Harita' },
    { id: 'list', label: '👥 Listele', count: potentials.length },
    { id: 'requests', label: '📬 İstekler', count: incoming.length || null },
  ];

  const displayLat = userLat || 40.9872;
  const displayLng = userLng || 29.0524;

  return (
    <AppLayout title="Eşleşmeler">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: tab === t.id ? 'rgba(232,160,32,0.12)' : 'rgba(245,237,216,0.04)',
              color: tab === t.id ? 'var(--amber)' : 'var(--mist)',
              border: tab === t.id ? '1px solid rgba(232,160,32,0.25)' : '1px solid rgba(245,237,216,0.08)',
            }}>
            {t.label}
            {t.count > 0 && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{t.count}</span>
            )}
          </button>
        ))}
        <button onClick={loadData}
          className="ml-auto px-3 py-2 rounded-xl transition-all"
          style={{ color: 'var(--mist)', border: '1px solid rgba(245,237,216,0.08)' }}
          title="Yenile">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Aktif eşleşme banner */}
      {activeMatches.length > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(58,138,90,0.08)', border: '1px solid rgba(58,138,90,0.2)' }}>
          <CheckCircle2 size={16} style={{ color: '#5ABF8A' }} />
          <p className="text-sm" style={{ color: '#5ABF8A' }}>
            {activeMatches.length} aktif eşleşmen var
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : (
        <>
          {/* ── HArita ── */}
          {tab === 'map' && (
            <div className="flex flex-col gap-3">
              {/* Konum durumu */}
              {locationStatus === 'loading' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', color: 'var(--amber)' }}>
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Konumun alınıyor...
                </div>
              )}
              {locationStatus === 'denied' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(138,154,170,0.08)', border: '1px solid rgba(138,154,170,0.2)', color: 'var(--mist)' }}>
                  📍 Konum izni verilmedi — kampüs konumu kullanılıyor
                </div>
              )}

              <div style={{ height: '480px' }}>
                <MatchMap
                  lat={displayLat}
                  lng={displayLng}
                  potentials={potentials}
                  onSelectUser={setSelectedUser}
                />
              </div>

              <div className="flex flex-wrap gap-3 px-1">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: '#E8A020', boxShadow: '0 0 6px rgba(232,160,32,0.7)' }} />
                  Sen
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#E8A020', background: 'rgba(232,160,32,0.2)' }} />
                  Yüksek uyum (%70+)
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#7A9E7A', background: 'rgba(122,158,122,0.2)' }} />
                  Orta uyum
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(90,122,90,0.8)', border: '1.5px solid #5A7A5A' }} />
                  Kampüs
                </div>
              </div>
            </div>
          )}

          {/* ── Liste ── */}
          {tab === 'list' && (
            potentials.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="font-display text-xl font-semibold text-cream mb-2">
                  {matches.length > 0 ? 'Tüm uyumlu kişilere istek gönderdin' : 'Eşleşme bulunamadı'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--mist)' }}>
                  Platform büyüdükçe eşleşmeler çıkacak.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potentials.map((user, i) => (
                  <div key={i} className="glass-card p-5 flex flex-col gap-4 hover:border-white/15 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                        {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cream">{user.displayName || 'Kullanıcı'}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--mist)' }}>
                          📍 {user.campusName || user.campus || 'Kampüs bilgisi yok'}
                        </p>
                      </div>
                      <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: 'var(--amber)' }}>
                        %{user.compatibilityScore}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(245,237,216,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${user.compatibilityScore}%`, background: 'var(--amber)' }} />
                    </div>
                    {user.commonSubjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {user.commonSubjects.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>
                            {s}
                          </span>
                        ))}
                        {user.commonSubjects.length > 3 && (
                          <span className="text-xs px-2 py-1" style={{ color: 'var(--mist)' }}>+{user.commonSubjects.length - 3}</span>
                        )}
                      </div>
                    )}
                    <button onClick={() => setSelectedUser(user)}
                      className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
                      <UserPlus size={15} /> Eşleşme İsteği Gönder
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── İstekler ── */}
          {tab === 'requests' && (
            <div className="flex flex-col gap-6">
              {incoming.length === 0 && sent.length === 0 && activeMatches.length === 0 ? (
                <div className="glass-card p-16 text-center">
                  <p className="text-4xl mb-4">📭</p>
                  <h3 className="font-display text-xl font-semibold text-cream mb-2">Bekleyen istek yok</h3>
                  <p className="text-sm" style={{ color: 'var(--mist)' }}>Haritadan veya listeden eşleşme isteği gönder.</p>
                </div>
              ) : (
                <>
                  {incoming.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Gelen İstekler ({incoming.length})</p>
                      <div className="flex flex-col gap-3">
                        {incoming.map(m => (
                          <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                              style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>?</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-cream">Eşleşme İsteği</p>
                              <p className="text-xs" style={{ color: 'var(--mist)' }}>
                                %{m.compatibilityScore} uyum · {(m.commonSubjects || []).slice(0, 2).join(', ')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleRespond(m.id, true)}
                                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                                <CheckCircle2 size={13} /> Kabul
                              </button>
                              <button onClick={() => handleRespond(m.id, false)}
                                className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1">
                                <XCircle size={13} /> Reddet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeMatches.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Aktif Eşleşmeler ({activeMatches.length})</p>
                      <div className="flex flex-col gap-3">
                        {activeMatches.map(m => (
                          <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                              style={{ background: 'rgba(58,138,90,0.15)', color: '#5ABF8A' }}>✓</div>
                            <div className="flex-1">
                              <p className="font-medium text-cream">Aktif Eşleşme</p>
                              <p className="text-xs" style={{ color: 'var(--mist)' }}>
                                {(m.commonSubjects || []).slice(0, 2).join(', ')}
                              </p>
                            </div>
                            <button onClick={() => handleEnd(m.id)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all"
                              style={{ color: '#E87070', border: '1px solid rgba(200,64,64,0.3)' }}>
                              Sonlandır
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sent.length > 0 && (
                    <div>
                      <p className="section-label mb-3">Gönderilen İstekler ({sent.length})</p>
                      <div className="flex flex-col gap-3">
                        {sent.map(m => (
                          <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                              style={{ background: 'rgba(138,154,170,0.1)', color: 'var(--mist)' }}>⏳</div>
                            <div className="flex-1">
                              <p className="font-medium text-cream">Bekleyen İstek</p>
                              <p className="text-xs" style={{ color: 'var(--mist)' }}>
                                {(m.commonSubjects || []).slice(0, 2).join(', ')}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full"
                              style={{ background: 'rgba(138,154,170,0.1)', color: 'var(--mist)' }}>
                              Yanıt bekleniyor
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Kullanıcı seçim modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8"
            style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                {selectedUser.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-cream">{selectedUser.displayName || 'Kullanıcı'}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>
                  📍 {selectedUser.campusName || selectedUser.campus || 'Kampüs bilinmiyor'}
                </p>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--mist)' }}>Uyum puanı</span>
                  <span style={{ color: 'var(--amber)' }}>%{selectedUser.compatibilityScore}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(245,237,216,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${selectedUser.compatibilityScore}%`, background: 'var(--amber)' }} />
                </div>
              </div>
              {selectedUser.commonSubjects?.length > 0 && (
                <div className="w-full text-left">
                  <p className="text-xs mb-2" style={{ color: 'var(--mist)' }}>Ortak dersler:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.commonSubjects.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(232,160,32,0.2)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleSendRequest(selectedUser)} disabled={sending}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                {sending
                  ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  : <><UserPlus size={15} /> İstek Gönder</>
                }
              </button>
              <button onClick={() => setSelectedUser(null)} className="btn-outline flex-1 py-3">İptal</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
