import { useState } from 'react';
import { ArrowLeft, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage({ onBack, signIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await Promise.race([
        signIn(email, password),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      if (result?.error) setError(result.error.message || 'Неверный email или пароль');
    } catch (err) {
      setError(err.message === 'timeout' ? 'Сервер не отвечает. Проверьте подключение.' : 'Ошибка входа: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-anthracite-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-extrabold text-white mb-1">
            Ремонт<span className="text-accent-500">Про</span>
          </p>
          <p className="text-gray-500 text-sm">Вход в панель управления</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-6 space-y-4">

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="admin@example.com" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Пароль</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>

        <button onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm mt-6 mx-auto">
          <ArrowLeft size={16} /> Вернуться на сайт
        </button>
      </div>
    </div>
  );
}
