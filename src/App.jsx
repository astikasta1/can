import { useState, useEffect, useRef } from 'react';
import {
  Hammer, Construction, Droplets, Zap, Wrench, ShieldCheck,
  Phone, Mail, MapPin, ChevronLeft, ChevronRight, CheckCircle2,
  ArrowRight, Clock, FileText, Handshake, HardHat, ClipboardCheck,
  Star, Menu, X, Calculator, Lock
} from 'lucide-react';
import AdminPanel from './AdminPanel';
import LoginPage from './LoginPage';
import { useAuth } from './useAuth';
import { saveLead, requestNotifications } from './leads';

/* ── Intersection Observer hook ── */
function useOnScreen() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Animated Counter ── */
function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useOnScreen();
  useEffect(() => {
    if (!visible) return;
    let cur = 0;
    const step = Math.ceil(end / (duration / 16));
    const id = setInterval(() => {
      cur += step;
      if (cur >= end) { setCount(end); clearInterval(id); }
      else setCount(cur);
    }, 16);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref} className="text-4xl md:text-5xl font-extrabold text-accent-500">{count}{suffix}</span>;
}

/* ── Section with fade-in ── */
function Section({ children, id, className = '' }) {
  const [ref, visible] = useOnScreen();
  return (
    <section id={id} ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      {children}
    </section>
  );
}

/* ── DATA ── */
const services = [
  { icon: Hammer, title: 'Демонтаж', desc: 'Снос перегородок, удаление старых покрытий, вывоз мусора. Быстро и аккуратно подготовим помещение к ремонту.', price: 450 },
  { icon: Construction, title: 'Стяжка пола', desc: 'Выравнивание основания под любое финишное покрытие. Используем проверенные материалы и технологии.', price: 800 },
  { icon: Wrench, title: 'Штукатурка стен', desc: 'Машинная и ручная штукатурка. Ровные стены — основа качественного ремонта.', price: 650 },
  { icon: Zap, title: 'Электромонтаж', desc: 'Разводка электрики, установка щитков, розеток и выключателей по современным стандартам.', price: 700 },
  { icon: Droplets, title: 'Сантехника', desc: 'Монтаж и замена труб, канализации. Надёжные соединения и проверенные материалы.', price: 600 },
  { icon: ShieldCheck, title: 'Гидроизоляция', desc: 'Защита от протечек в ванных, санузлах и на балконах. Гарантия герметичности.', price: 500 },
];

const steps = [
  { icon: Phone, title: 'Заявка' },
  { icon: ClipboardCheck, title: 'Замер' },
  { icon: Calculator, title: 'Смета' },
  { icon: Handshake, title: 'Договор' },
  { icon: HardHat, title: 'Работа' },
  { icon: CheckCircle2, title: 'Сдача' },
];

const reviews = [
  { name: 'Алексей К.', text: 'Ребята сделали стяжку и штукатурку за неделю. Качество отличное, рекомендую всем!', rating: 5 },
  { name: 'Мария С.', text: 'Заказывали полный демонтаж и электрику. Всё чётко по срокам, мастера вежливые и аккуратные.', rating: 5 },
  { name: 'Дмитрий В.', text: 'Гидроизоляцию и сантехнику доверил этой команде. Через год — ни одной проблемы. Спасибо!', rating: 5 },
  { name: 'Ольга Н.', text: 'Очень довольна результатом! Стены идеально ровные, полы как зеркало. Цены адекватные.', rating: 4 },
  { name: 'Сергей Т.', text: 'Второй раз обращаюсь. Сделали черновую в новостройке за 3 недели. Всё на высшем уровне.', rating: 5 },
];

const stats = [
  { value: 12, suffix: '+', label: 'Лет опыта' },
  { value: 850, suffix: '+', label: 'Объектов сдано' },
  { value: 45, suffix: '', label: 'Мастеров в штате' },
  { value: 24, suffix: '', label: 'Месяца гарантии' },
];

/* ════════════════════════════════════ */
/*             MAIN APP                */
/* ════════════════════════════════════ */
export default function App() {
  /* hash routing */
  const [page, setPage] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setPage(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const { session, loading, signIn, signOut } = useAuth();

  if (page === '#admin') {
    if (loading) return (
      <div className="min-h-screen bg-anthracite-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
    if (!session) return <LoginPage onBack={() => { window.location.hash = ''; }} signIn={signIn} />;
    return <AdminPanel onBack={() => { window.location.hash = ''; }} signOut={signOut} />;
  }

  /* request notification permission on mount */
  useEffect(() => { requestNotifications(); }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  /* calculator */
  const [area, setArea] = useState(50);
  const [selected, setSelected] = useState({});
  const toggle = (t) => setSelected(p => ({ ...p, [t]: !p[t] }));
  const total = services.reduce((s, sv) => s + (selected[sv.title] ? sv.price * area : 0), 0);

  /* reviews slider */
  const [slide, setSlide] = useState(0);
  const next = () => setSlide(p => (p + 1) % reviews.length);
  const prev = () => setSlide(p => (p - 1 + reviews.length) % reviews.length);
  useEffect(() => { const id = setInterval(next, 5000); return () => clearInterval(id); }, []);

  /* contact form */
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await saveLead({ name: form.name, phone: form.phone, message: form.message });
    setSending(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', phone: '', message: '' });
  };

  const links = [
    ['Услуги', '#services'], ['Калькулятор', '#calc'], ['Почему мы', '#why'],
    ['Этапы', '#steps'], ['Отзывы', '#reviews'], ['Контакты', '#contact'],
  ];

  return (
    <div className="min-h-screen bg-anthracite-950 text-gray-200 font-sans overflow-x-hidden">

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-anthracite-950/80 backdrop-blur-lg border-b border-anthracite-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <a href="#" className="text-xl font-extrabold tracking-tight text-white">
            Ремонт<span className="text-accent-500">Про</span>
          </a>
          <div className="hidden md:flex gap-6">
            {links.map(([t, h]) => (
              <a key={h} href={h} className="text-sm text-gray-400 hover:text-accent-400 transition-colors">{t}</a>
            ))}
          </div>
          <a href="#calc" className="hidden md:inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95">
            Рассчитать стоимость
          </a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-300">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-anthracite-900/95 backdrop-blur-lg border-t border-anthracite-700/50 px-6 pb-6 pt-2 space-y-3">
            {links.map(([t, h]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-accent-400 transition-colors py-1">{t}</a>
            ))}
            <a href="#calc" onClick={() => setMenuOpen(false)} className="block text-center bg-accent-500 text-white font-semibold py-2.5 rounded-xl mt-2">
              Рассчитать стоимость
            </a>
          </div>
        )}
      </nav>

      {/* ═══ 1. HERO ═══ */}
      <header className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-anthracite-950 via-anthracite-900 to-anthracite-950">
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-accent-400 font-semibold tracking-widest uppercase text-sm mb-4 animate-fade-in-up">
            Черновые работы под ключ
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up [animation-delay:.15s]">
            Надёжная основа<br />для <span className="text-accent-500">вашего ремонта</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up [animation-delay:.3s]">
            Профессиональные черновые работы в квартирах и новостройках Москвы. Фиксированные цены, соблюдение сроков, гарантия 2 года.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up [animation-delay:.45s]">
            <a href="#calc" className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-500/25 active:scale-95">
              <Calculator size={20} /> Рассчитать стоимость
            </a>
            <a href="#services" className="inline-flex items-center justify-center gap-2 border border-anthracite-600 hover:border-accent-500/50 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all hover:bg-anthracite-800">
              Наши услуги <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </header>

      {/* ═══ 2. SERVICES ═══ */}
      <Section id="services" className="py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-4">
            Наши <span className="text-accent-500">услуги</span>
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
            Выполняем полный спектр черновых работ. Каждый этап — под контролем прораба.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon: Icon, title, desc, price }) => (
              <div key={title} className="group relative bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-accent-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-500/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 transition-colors">
                    <Icon size={24} className="text-accent-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3 max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    {desc}
                  </p>
                  <p className="text-accent-400 font-semibold text-sm">от {price} ₽/м²</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 3. CALCULATOR ═══ */}
      <Section id="calc" className="py-20 md:py-28 px-4 bg-anthracite-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-4">
            Рассчитайте <span className="text-accent-500">стоимость</span>
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-12">
            Укажите площадь и выберите нужные работы — мы покажем примерную стоимость.
          </p>
          <div className="bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-6 md:p-10">
            <label className="block mb-2 text-sm font-semibold text-gray-300">
              Площадь квартиры: <span className="text-accent-400">{area} м²</span>
            </label>
            <input type="range" min={20} max={200} value={area} onChange={e => setArea(+e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-8 bg-anthracite-700 accent-accent-500" />
            <p className="text-sm font-semibold text-gray-300 mb-4">Выберите виды работ:</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {services.map(({ icon: Icon, title, price }) => (
                <label key={title}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selected[title] ? 'border-accent-500 bg-accent-500/10' : 'border-anthracite-700/50 hover:border-anthracite-600'}`}>
                  <input type="checkbox" checked={!!selected[title]} onChange={() => toggle(title)} className="sr-only" />
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selected[title] ? 'bg-accent-500 border-accent-500' : 'border-anthracite-600'}`}>
                    {selected[title] && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <Icon size={18} className="text-accent-500" />
                  <span className="text-sm text-gray-200 font-medium flex-1">{title}</span>
                  <span className="text-xs text-gray-500">{price} ₽/м²</span>
                </label>
              ))}
            </div>
            <div className="text-center p-6 rounded-xl bg-anthracite-800 border border-anthracite-700/50">
              <p className="text-gray-400 text-sm mb-1">Примерная стоимость</p>
              <p className="text-4xl md:text-5xl font-extrabold text-accent-500 transition-all">
                {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
              </p>
              <p className="text-gray-500 text-xs mt-2">* Точная стоимость — после замера</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 4. WHY US ═══ */}
      <Section id="why" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-14">
            Почему <span className="text-accent-500">мы</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="text-center bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-8 hover:border-accent-500/30 transition-colors">
                <AnimatedCounter end={value} suffix={suffix} />
                <p className="text-gray-400 mt-3 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 5. STEPS ═══ */}
      <Section id="steps" className="py-20 md:py-28 px-4 bg-anthracite-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-14">
            Этапы <span className="text-accent-500">работы</span>
          </h2>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-0">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-anthracite-700 -translate-y-1/2" />
            {steps.map(({ icon: Icon, title }, i) => (
              <div key={title} className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-anthracite-800 border-2 border-accent-500 flex items-center justify-center shrink-0 transition-transform hover:scale-110">
                  <Icon size={22} className="text-accent-400" />
                </div>
                <div className="md:text-center">
                  <span className="text-xs text-accent-500 font-bold">0{i + 1}</span>
                  <p className="text-sm font-semibold text-white">{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 6. REVIEWS ═══ */}
      <Section id="reviews" className="py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-14">
            Отзывы <span className="text-accent-500">клиентов</span>
          </h2>
          <div className="relative">
            <div className="bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-8 md:p-10 min-h-[200px] flex flex-col justify-center transition-all">
              <div className="flex gap-1 justify-center mb-4">
                {Array.from({ length: reviews[slide].rating }).map((_, i) => (
                  <Star key={i} size={18} className="text-accent-400 fill-accent-400" />
                ))}
              </div>
              <p className="text-gray-300 text-center text-lg leading-relaxed mb-6 italic">
                &laquo;{reviews[slide].text}&raquo;
              </p>
              <p className="text-center text-accent-400 font-semibold">{reviews[slide].name}</p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="w-10 h-10 rounded-full border border-anthracite-700 flex items-center justify-center hover:border-accent-500 hover:text-accent-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className={`h-2.5 rounded-full transition-all ${i === slide ? 'bg-accent-500 w-6' : 'bg-anthracite-600 hover:bg-anthracite-500 w-2.5'}`} />
                ))}
              </div>
              <button onClick={next} className="w-10 h-10 rounded-full border border-anthracite-700 flex items-center justify-center hover:border-accent-500 hover:text-accent-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 7. CTA + FORM ═══ */}
      <Section id="contact" className="py-20 md:py-28 px-4 bg-gradient-to-b from-anthracite-900/50 to-anthracite-950">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Готовы <span className="text-accent-500">начать?</span>
          </h2>
          <p className="text-gray-400 mb-10">
            Оставьте заявку — мы перезвоним в течение 15 минут и обсудим ваш проект.
          </p>
          {submitted ? (
            <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-8 animate-fade-in-up">
              <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
              <p className="text-green-300 font-semibold text-lg">Заявка отправлена!</p>
              <p className="text-gray-400 text-sm mt-1">Мы свяжемся с вами в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-anthracite-900 border border-anthracite-700/50 rounded-2xl p-6 md:p-8 space-y-4">
              <input type="text" required placeholder="Ваше имя" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors" />
              <input type="tel" required placeholder="Телефон" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors" />
              <textarea placeholder="Сообщение (необязательно)" value={form.message} rows={3}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-anthracite-800 border border-anthracite-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors resize-none" />
              <button type="submit" disabled={sending} className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-accent-500/25 active:scale-95">
                {sending ? 'Отправка…' : 'Оставить заявку'}
              </button>
            </form>
          )}
        </div>
      </Section>

      {/* ═══ 8. FOOTER ═══ */}
      <footer className="border-t border-anthracite-700/50 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          <div>
            <p className="text-xl font-extrabold text-white mb-3">Ремонт<span className="text-accent-500">Про</span></p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Профессиональные черновые работы в квартирах и новостройках Москвы с 2013 года.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white mb-2">Контакты</p>
            <a href="tel:+74951234567" className="flex items-center gap-2 text-gray-400 hover:text-accent-400 transition-colors text-sm">
              <Phone size={16} /> +7 (495) 123-45-67
            </a>
            <a href="mailto:info@remontpro.ru" className="flex items-center gap-2 text-gray-400 hover:text-accent-400 transition-colors text-sm">
              <Mail size={16} /> info@remontpro.ru
            </a>
            <p className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={16} /> Москва, ул. Строителей, 15
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white mb-2">Мы в соцсетях</p>
            <div className="flex gap-3">
              {['VK', 'TG', 'WA'].map(name => (
                <a key={name} href="#"
                  className="w-10 h-10 rounded-xl bg-anthracite-800 border border-anthracite-700/50 flex items-center justify-center text-gray-400 hover:text-accent-400 hover:border-accent-500/50 transition-all text-xs font-bold">
                  {name}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-anthracite-700/30 flex items-center justify-center gap-4 text-gray-600 text-xs">
          <span>&copy; 2013–2026 РемонтПро. Все права защищены.</span>
          <a href="#admin" className="inline-flex items-center gap-1 text-gray-600 hover:text-accent-400 transition-colors">
            <Lock size={11} /> Админ
          </a>
        </div>
      </footer>
    </div>
  );
}
