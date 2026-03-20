import { supabase } from './supabaseClient';

/*
  SQL для Supabase Dashboard (выполнить один раз):

  CREATE TABLE leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    message text DEFAULT '',
    status text NOT NULL DEFAULT 'new'
      CHECK (status IN ('new','in_progress','done','rejected')),
    note text DEFAULT '',
    created_at timestamptz DEFAULT now() NOT NULL
  );

  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Anyone can insert leads"
    ON leads FOR INSERT WITH CHECK (true);

  CREATE POLICY "Auth users can select"
    ON leads FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY "Auth users can update"
    ON leads FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Auth users can delete"
    ON leads FOR DELETE USING (auth.role() = 'authenticated');

  ALTER PUBLICATION supabase_realtime ADD TABLE leads;
*/

/* ── localStorage fallback ── */
const LS_KEY = 'remontpro_leads';

function lsGet() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsSave(leads) {
  localStorage.setItem(LS_KEY, JSON.stringify(leads));
}

/* ── helpers ── */
function mapRow(row) {
  return { ...row, createdAt: row.created_at };
}

function notify(lead) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Новая заявка!', {
        body: `${lead.name} — ${lead.phone}`,
        icon: '/favicon.svg',
      });
    }
  } catch { /* ignore */ }
}

/* ── CRUD ── */

export async function getLeads() {
  if (!supabase) return lsGet();
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getLeads:', error); return []; }
    return data.map(mapRow);
  } catch (e) { console.error('getLeads:', e); return []; }
}

export async function saveLead(lead) {
  if (!supabase) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: lead.name,
      phone: lead.phone,
      message: lead.message || '',
      status: 'new',
      note: '',
      createdAt: new Date().toISOString(),
    };
    const leads = lsGet();
    leads.unshift(entry);
    lsSave(leads);
    notify(lead);
    return entry;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({ name: lead.name, phone: lead.phone, message: lead.message || '' })
      .select()
      .single();
    if (error) { console.error('saveLead:', error); return null; }
    notify(lead);
    return mapRow(data);
  } catch (e) { console.error('saveLead:', e); return null; }
}

export async function updateLead(id, patch) {
  if (!supabase) {
    const leads = lsGet();
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) { leads[idx] = { ...leads[idx], ...patch }; lsSave(leads); }
    return;
  }
  try {
    const { error } = await supabase.from('leads').update(patch).eq('id', id);
    if (error) console.error('updateLead:', error);
  } catch (e) { console.error('updateLead:', e); }
}

export async function deleteLead(id) {
  if (!supabase) {
    lsSave(lsGet().filter(l => l.id !== id));
    return;
  }
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) console.error('deleteLead:', error);
  } catch (e) { console.error('deleteLead:', e); }
}

export function subscribeToLeads(onRefresh, onInsert) {
  if (!supabase) {
    const id = setInterval(onRefresh, 3000);
    return () => clearInterval(id);
  }

  const channel = supabase
    .channel('leads-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
      if (onInsert) onInsert(payload.new);
      onRefresh();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, () => onRefresh())
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, () => onRefresh())
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
