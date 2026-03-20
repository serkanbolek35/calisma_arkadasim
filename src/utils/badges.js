// Rozet tanımları
export const BADGE_DEFS = [
  { id: 'first_session',   icon: '🎯', label: 'İlk Adım',         desc: 'İlk çalışma oturumunu tamamladı',         check: (s, r) => s.total >= 1 },
  { id: 'five_sessions',   icon: '🔥', label: 'Odaklı Öğrenci',   desc: '5 oturum tamamladı',                      check: (s, r) => s.total >= 5 },
  { id: 'ten_sessions',    icon: '⚡', label: 'Verimli Çalışan',  desc: '10 oturum tamamladı',                     check: (s, r) => s.total >= 10 },
  { id: 'team_player',     icon: '🤝', label: 'Ekip Oyuncusu',    desc: '3 ortak oturum tamamladı',                check: (s, r) => s.partner >= 3 },
  { id: 'five_hours',      icon: '⏱', label: 'Zaman Ustası',     desc: 'Toplam 5 saat çalıştı',                  check: (s, r) => s.totalMins >= 300 },
  { id: 'twenty_hours',    icon: '🏆', label: 'Çalışma Makinesi', desc: 'Toplam 20 saat çalıştı',                 check: (s, r) => s.totalMins >= 1200 },
  { id: 'high_rating',     icon: '⭐', label: 'Güvenilir Partner', desc: 'Ortalama 4+ yıldız aldı (min 3 yorum)', check: (s, r) => r.count >= 3 && r.avg >= 4 },
  { id: 'reviewed',        icon: '💬', label: 'Değerlendirilen',  desc: 'En az 1 yorum aldı',                     check: (s, r) => r.count >= 1 },
];

// Kazanılan rozetleri hesapla
export const calcBadges = (sessionStats, reviewStats) => {
  return BADGE_DEFS.filter(b => b.check(sessionStats, reviewStats));
};
