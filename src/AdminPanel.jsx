import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Trash2, MessageSquare, Phone, Clock, Search,
  Bell, BellOff, ChevronDown, Users, AlertCircle, CheckCircle2,
  Filter, Download, Lock, LogOut, ShieldCheck
} from 'lucide-react';
import { getLeads, updateLead, deleteLead, requestNotifications } from './leads';

const STATUS = {
  new: { label: 'Новая', color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  in_progress: { label: 'В работе', color: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  done: { label: 'Завершена', color: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  rejected: { label: 'Отклонена', color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

const ADMIN_SESSION_KEY = 'remontpro_admin_session';

function Badge({ status }) {
  const s = STATUS[status] || STATUS.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  const IconComponent = icon;

  return (
    <div className="bg-anthracite-900 border border-anthracite-700/50 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <IconComponent size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function hasAdminSession() {
  try {
    return Boolean(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return false;
  }
}

function saveAdminSession(login) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ login, createdAt: new Date().toISOString() }));
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function AdminLogin({ credentials, error, onChange, onSubmit, onBack }) {
  return (
    <div className="min-h-screen bg-anthracite-950 text-gray-200 px-4 py-10">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft size={18} /> На сайт
        </button>

        <div className="rounded-3xl border border-anthracite-700/50 bg-anthracite-900 p-6 md:p-8 shadow-2xl shadow-black/20">
          <div className="w-14 h-14 rounded-2xl bg-accent-500/10 text-accent-400 flex items-center justify-center mb-5">
            <ShieldCheck size={26} />
          </div>

          <p className="text-sm uppercase tracking-[0.24em] text-accent-400 mb-3">Админ-панель</p>
          <h1 className="text-3xl font-extrabold text-white mb-3">Вход в CRM</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Введите логин и пароль, чтобы открыть список заявок. Если поля пустые, система покажет понятную ошибку вместо пустого экрана.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-login" className="block text-sm font-medium text-gray-300 mb-2">Логин</label>
              <input
                id="admin-login"
                type="text"
                autoComplete="username"
                value={credentials.login}
                onChange={e => onChange('login', e.target.value)}
                placeholder="Введите логин"
                className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300 mb-2">Пароль</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={e => onChange('password', e.target.value)}
                placeholder="Введите пароль"
                className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold py-3.5 rounded-xl transition-colors">
              <Lock size={18} /> Войти
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ onBack }) {
  const [isAuthorized, setIsAuthorized] = useState(() => hasAdminSession());
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [leads, setLeads] = useState(() => getLeads());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(() => 'Notification' in window && Notification.permission === 'granted');

  const refresh = useCallback(() => setLeads(getLeads()), []);

  useEffect(() => {
    if (!isAuthorized) return undefined;

    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [isAuthorized, refresh]);

  const handleCredentials = (field, value) => {
    setAuthError('');
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const login = credentials.login.trim();
    const password = credentials.password.trim();

    if (login.length < 3) {
      setAuthError('Введите логин минимум из 3 символов.');
      return;
    }

    if (password.length < 4) {
      setAuthError('Введите пароль минимум из 4 символов.');
      return;
    }

    saveAdminSession(login);
    setIsAuthorized(true);
    setAuthError('');
    setCredentials({ login: '', password: '' });
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthorized(false);
    setExpandedId(null);
    setSearch('');
    setFilterStatus('all');
    setCredentials({ login: '', password: '' });
  };

  const handleStatus = (id, status) => {
    updateLead(id, { status });
    refresh();
  };

  const handleNote = (id, note) => {
    updateLead(id, { note });
    refresh();
  };

  const handleDelete = (id) => {
    deleteLead(id);
    setExpandedId(null);
    refresh();
  };

  const enableNotif = () => {
    requestNotifications();
    setTimeout(() => {
      if ('Notification' in window) {
        setNotifEnabled(Notification.permission === 'granted');
      }
    }, 1000);
  };

  const exportCSV = () => {
    const header = 'Имя,Телефон,Статус,Заметка,Дата\n';
    const rows = leads.map(l =>
      `"${l.name}","${l.phone}","${STATUS[l.status]?.label || l.status}","${(l.note || '').replace(/"/g, '""')}","${fmtDate(l.createdAt)}"`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name?.toLowerCase().includes(q) || l.phone?.includes(q);
    }
    return true;
  });

  const counts = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    in_progress: leads.filter(l => l.status === 'in_progress').length,
    done: leads.filter(l => l.status === 'done').length,
  };

  if (!isAuthorized) {
    return (
      <AdminLogin
        credentials={credentials}
        error={authError}
        onChange={handleCredentials}
        onSubmit={handleLogin}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-anthracite-950 text-gray-200">
      <div className="sticky top-0 z-50 bg-anthracite-950/80 backdrop-blur-lg border-b border-anthracite-700/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 h-16 gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={18} /> На сайт
          </button>
          <h1 className="text-lg font-extrabold text-white text-center flex-1">
            Ремонт<span className="text-accent-500">Про</span> <span className="text-gray-500 font-normal text-sm ml-2">CRM</span>
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={exportCSV} title="Экспорт CSV"
              className="w-9 h-9 rounded-lg border border-anthracite-700/50 flex items-center justify-center text-gray-400 hover:text-accent-400 hover:border-accent-500/50 transition-colors">
              <Download size={16} />
            </button>
            <button onClick={enableNotif} title={notifEnabled ? 'Уведомления включены' : 'Включить уведомления'}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${notifEnabled ? 'border-green-500/50 text-green-400' : 'border-anthracite-700/50 text-gray-400 hover:text-accent-400 hover:border-accent-500/50'}`}>
              {notifEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            <button onClick={handleLogout} title="Выйти"
              className="w-9 h-9 rounded-lg border border-anthracite-700/50 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Всего заявок" value={counts.total} color="bg-accent-500/10 text-accent-400" />
          <StatCard icon={AlertCircle} label="Новые" value={counts.new} color="bg-blue-500/10 text-blue-400" />
          <StatCard icon={Clock} label="В работе" value={counts.in_progress} color="bg-amber-500/10 text-amber-400" />
          <StatCard icon={CheckCircle2} label="Завершено" value={counts.done} color="bg-green-500/10 text-green-400" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Поиск по имени или телефону…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-anthracite-900 border border-anthracite-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-anthracite-900 border border-anthracite-700/50 rounded-xl pl-9 pr-10 py-3 text-sm text-gray-300 focus:outline-none focus:border-accent-500 transition-colors cursor-pointer">
              <option value="all">Все статусы</option>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="text-anthracite-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {leads.length === 0 ? 'Заявок пока нет' : 'Ничего не найдено'}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              {leads.length === 0 ? 'Когда кто-то оставит заявку на сайте, она появится здесь.' : 'Попробуйте изменить фильтры.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => {
              const expanded = expandedId === lead.id;
              return (
                <div key={lead.id}
                  className={`bg-anthracite-900 border rounded-xl transition-all ${expanded ? 'border-accent-500/50 shadow-lg shadow-accent-500/5' : 'border-anthracite-700/50 hover:border-anthracite-600'}`}>
                  <button onClick={() => setExpandedId(expanded ? null : lead.id)}
                    className="w-full flex items-center gap-4 p-4 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' : 'bg-anthracite-800 text-gray-400'}`}>
                      {lead.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{lead.name}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1.5">
                        <Phone size={11} /> {lead.phone}
                      </p>
                    </div>
                    <Badge status={lead.status} />
                    <span className="text-gray-600 text-xs hidden sm:block whitespace-nowrap">
                      {fmtDate(lead.createdAt)}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-anthracite-700/30 space-y-4">
                      <div className="flex flex-wrap gap-4 pt-4 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs block mb-1">Дата</span>
                          <span className="text-gray-300">{fmtDate(lead.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block mb-1">Телефон</span>
                          <a href={`tel:${lead.phone}`} className="text-accent-400 hover:underline">{lead.phone}</a>
                        </div>
                        {lead.message && (
                          <div className="w-full">
                            <span className="text-gray-500 text-xs block mb-1">Сообщение</span>
                            <span className="text-gray-300">{lead.message}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs block mb-2">Статус</span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(STATUS).map(([key, val]) => (
                            <button key={key} onClick={() => handleStatus(lead.id, key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${lead.status === key ? `${val.bg} ${val.text}` : 'border-anthracite-700/50 text-gray-500 hover:text-gray-300 hover:border-anthracite-600'}`}>
                              {val.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs block mb-2">Заметка</span>
                        <textarea
                          value={lead.note || ''}
                          onChange={e => handleNote(lead.id, e.target.value)}
                          placeholder="Добавить заметку…"
                          rows={2}
                          className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 transition-colors resize-none" />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <a href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-colors">
                          <Phone size={13} /> Позвонить
                        </a>
                        <button onClick={() => handleDelete(lead.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors">
                          <Trash2 size={13} /> Удалить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
