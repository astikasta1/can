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

  -- Публичная форма: вставка без авторизации
  CREATE POLICY "Anyone can insert leads"
    ON leads FOR INSERT WITH CHECK (true);

  -- Админ: чтение, обновление, удаление
  CREATE POLICY "Auth users can select"
    ON leads FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY "Auth users can update"
    ON leads FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Auth users can delete"
    ON leads FOR DELETE USING (auth.role() = 'authenticated');

  -- Включить real-time
  ALTER PUBLICATION supabase_realtime ADD TABLE leads;
*/

function mapRow(row) {
  return { ...row, createdAt: row.created_at };
}

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getLeads:', error); return []; }
  return data.map(mapRow);
}

export async function saveLead(lead) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ name: lead.name, phone: lead.phone, message: lead.message || '' })
    .select()
    .single();

  if (error) { console.error('saveLead:', error); return null; }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Новая заявка!', {
      body: `${lead.name} — ${lead.phone}`,
      icon: '/favicon.svg',
    });
  }

  return mapRow(data);
}

export async function updateLead(id, patch) {
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  if (error) console.error('updateLead:', error);
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) console.error('deleteLead:', error);
}

export function subscribeToLeads(onRefresh, onInsert) {
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
