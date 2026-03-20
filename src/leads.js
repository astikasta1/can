const KEY = 'remontpro_leads';

export function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLead(lead) {
  const leads = getLeads();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...lead,
    status: 'new',
    note: '',
    createdAt: new Date().toISOString(),
  };

  leads.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(leads));

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Новая заявка!', {
      body: `${lead.name} — ${lead.phone}`,
      icon: '/favicon.svg',
    });
  }

  return entry;
}

export function updateLead(id, patch) {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return;
  leads[idx] = { ...leads[idx], ...patch };
  localStorage.setItem(KEY, JSON.stringify(leads));
  return leads[idx];
}

export function deleteLead(id) {
  const leads = getLeads().filter(l => l.id !== id);
  localStorage.setItem(KEY, JSON.stringify(leads));
}

export function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
