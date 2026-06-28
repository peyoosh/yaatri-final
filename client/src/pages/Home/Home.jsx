import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, ShieldCheck, Heart, Sparkles, MapPin, Users, Flame, Star, Send } from 'lucide-react';
import api from '../../api/axios';
import { formatMetricNumber } from '../../utils/formatMetrics';

export default function Home() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [metrics, setMetrics] = useState({ locations: 0, guides: 0, users: 0, years: 1 });

  useEffect(() => {
    const load = async () => {
      const [destsRes, statsRes] = await Promise.allSettled([
        api.get('/destinations'),
        api.get('/stats/metrics'),
      ]);
      if (destsRes.status === 'fulfilled') setDestinations(destsRes.value.data || []);
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data || {};
        setMetrics({
          locations: s.locations || 0,
          guides:    s.guides    || 0,
          users:     s.users     || 0,
          years:     s.years     || 1,
        });
      }
    };
    load();
  }, []);

  const doubled = [...destinations, ...destinations];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <div className="w-full bg-slate-50 overflow-x-hidden pt-20">

      {/* ── SECTION 1: HERO ── */}
      {/* Inline styles for height + bg guarantee rendering regardless of Tailwind v4 JIT */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '90vh', backgroundColor: '#0f172a', color: 'white' }}
      >
        <div className="absolute inset-0 z-0">
          {/* Local image — no external dependency, always loads */}
          <img
            src="/nepal-bg.jpg"
            alt="Nepal Himalayas"
            className="w-full h-full object-cover"
            style={{ opacity: 0.55 }}
          />
          {/* Inline gradient overlays — avoids custom color token opacity-modifier issues */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f172a 0%, rgba(15,23,42,0.75) 50%, transparent 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.45), transparent)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-6"
          >
            <span className="px-4 py-1.5 rounded-full bg-brand-blue/20 border border-brand-blue/30 text-xs font-bold uppercase tracking-widest text-brand-saffron flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-saffron fill-brand-saffron" />
              Nepal's first verified, escrow-backed trek marketplace
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Trek Nepal{' '}
              <span style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(to right, #2563EB, #60a5fa, #DB2777)', backgroundClip: 'text' }}>
                without the risk.
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Every guide on Yaatri is verified in person. Every hotel has been stayed in by a real traveler.
              Your payment sits in escrow until you're back safely — no deposits that disappear, no surprises at altitude.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mt-4">
              <button
                onClick={() => navigate('/destinations')}
                className="w-full sm:w-auto px-8 py-4 bg-brand-blue hover:bg-brand-blue/90 font-bold rounded-xl shadow-lg shadow-brand-blue/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Explore Destinations
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                ✦ Chat with AI Guide
              </button>
            </div>
          </motion.div>
        </div>

        {/* Fade into page background — inline to guarantee rendering */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 64, background: 'linear-gradient(to top, #f8fafc, transparent)' }} />
      </section>

      {/* ── SECTION 2: DESTINATION SLIDER ── */}
      <section className="py-20 w-full">
        <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-brand-pink uppercase tracking-widest block mb-2">VERIFIED DESTINATIONS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-slate tracking-tight">
              Where will you go?
            </h2>
          </div>
          <button
            onClick={() => navigate('/destinations')}
            className="text-sm font-bold text-brand-blue flex items-center gap-1 group hover:underline cursor-pointer"
          >
            View All Terrain Rankings
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative w-full">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto py-4 px-2 no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
          >
            {(doubled.length > 0 ? doubled : Array(6).fill(null)).map((dest, idx) => (
              dest ? (
                <div
                  key={`${dest._id}-${idx}`}
                  onClick={() => navigate(`/destination/${dest._id}`)}
                  className="min-w-[280px] sm:min-w-[340px] max-w-[340px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md shadow-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex-shrink-0"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={dest.imageURL}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-sm text-[10px] font-bold text-brand-pink rounded-full uppercase tracking-wider shadow-sm">
                      {dest.region}
                    </span>
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-brand-saffron/90 backdrop-blur-sm text-[11px] font-extrabold text-white rounded-lg flex items-center gap-0.5 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                      <span>{dest.popularityScore}%</span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="font-extrabold text-lg text-brand-slate group-hover:text-brand-blue transition-colors line-clamp-1">
                        {dest.name}
                      </h3>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-blue" />
                        {dest.terrainType}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-1">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Cost</p>
                        <p className="text-base font-bold text-brand-green">
                          NPR 2,500<span className="text-xs font-medium text-gray-500"> /day</span>
                        </p>
                      </div>
                      <span className="px-3.5 py-2 rounded-lg bg-brand-blue/5 group-hover:bg-brand-blue group-hover:text-white text-xs font-bold text-brand-blue transition-colors flex items-center gap-1">
                        Explore
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={idx} className="min-w-[280px] sm:min-w-[340px] max-w-[340px] bg-white rounded-2xl border border-slate-100 flex-shrink-0 h-64 animate-pulse" />
              )
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* ── SECTION 3: THREE WAYS ── */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest">HOW YOU WANT TO TREK</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-slate mt-2 tracking-tight">
              Three honest ways to do it
            </h2>
            <p className="text-gray-500 font-medium text-sm mt-3">
              No package names. No upsells. Just three real approaches — pick what matches your fitness, your timeline, and how much hand-holding you actually want.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: Compass,
                color: 'bg-brand-blue/10 text-brand-blue',
                hover: 'hover:border-brand-blue/30',
                title: 'Private Guided Trek',
                desc: 'You, a verified Sherpa guide, and no fixed itinerary. Set your own pace, choose your altitude ceiling, take the side trails most tourists miss. Guide fees, tea house bookings, and permit advice all included — starting at NPR 3,500/person/day.',
                linkColor: 'text-brand-blue group-hover:text-brand-pink',
                label: 'Browse verified guides →',
              },
              {
                Icon: Users,
                color: 'bg-brand-saffron/10 text-brand-saffron',
                hover: 'hover:border-brand-saffron/30',
                title: 'Tea House Group Trek',
                desc: 'Join 4–10 people on EBC, Annapurna Circuit, or Langtang on fixed departure dates. Tea houses pre-booked so you never scramble for a bed. The most affordable way to do a classic Nepal route without going it alone.',
                linkColor: 'text-brand-saffron group-hover:text-brand-blue',
                label: 'See group departures →',
              },
              {
                Icon: Flame,
                color: 'bg-brand-pink/10 text-brand-pink',
                hover: 'hover:border-brand-pink/30',
                title: 'Self-Guided with Backup',
                desc: 'For experienced trekkers who want independence without abandoning safety. We handle permits, pre-book your lodges, and give you a check-in system that alerts your contact if you go quiet. No guide, no babysitting — but we know where you are.',
                linkColor: 'text-brand-pink group-hover:text-brand-saffron',
                label: 'Plan your own route →',
              },
            ].map(({ Icon, color, hover, title, desc, linkColor, label }) => (
              <div
                key={title}
                className={`p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between ${hover}`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-slate mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{desc}</p>
                </div>
                <button
                  onClick={() => navigate('/destinations')}
                  className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${linkColor}`}
                >
                  {label} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: STATS ── */}
      <section className="py-24 w-full">
        <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest">WHY YAATRI EXISTS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-slate tracking-tight leading-tight">
              The Himalayan trekking industry has a trust problem. We're fixing it.
            </h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Guides who don't show up. Hotels that take deposits and go silent. Prices quoted in dollars that double by arrival day. Yaatri puts your payment in escrow, verifies every guide in person, and only releases funds when your trip is confirmed done.
            </p>
            <button
              onClick={() => navigate('/destinations')}
              className="px-6 py-3 text-white text-xs font-bold transition-all rounded-xl cursor-pointer inline-flex items-center gap-2 self-start hover:opacity-90" style={{ backgroundColor: '#0f172a' }}
            >
              Explore Live Catalog
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: `${metrics.locations || 12}+`, label: 'Verified Destinations', sub: 'Himalayan, Hill, and Terai — every terrain type covered.', color: 'text-brand-blue' },
              { value: `${metrics.guides || 45}+`, label: 'In-Person Vetted Guides', sub: 'Each one interviewed, reference-checked, and trail-tested.', color: 'text-brand-saffron' },
              { value: `${formatMetricNumber(metrics.users) || '1,800'}+`, label: 'Travelers Protected', sub: 'Every booking covered by our escrow guarantee.', color: 'text-brand-green' },
            ].map(({ value, label, sub, color }) => (
              <div key={label} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-center lg:text-left flex flex-col gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold block ${color}`}>{value}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA BANNER ── full-width dark band */}
      <section className="w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center gap-6 text-white">
            <span className="px-3.5 py-1 rounded-full bg-brand-green/20 border border-brand-green/30 text-[10px] font-bold uppercase tracking-wider text-brand-green self-start">
              No upfront risk
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to actually plan this trip?
            </h2>
            <p className="text-slate-300 font-medium text-sm leading-relaxed max-w-lg">
              Browse real guides with real reviews. Compare routes by altitude, terrain, and difficulty. Lock in your dates and pay securely — your money doesn't move until you confirm the trip is done exactly as promised.
            </p>
            <div className="flex items-center gap-6 mt-2">
              <button
                onClick={() => navigate('/destinations')}
                className="px-6 py-3.5 bg-brand-blue hover:bg-brand-blue/90 font-bold text-xs rounded-xl shadow-md shadow-brand-blue/25 transition-all cursor-pointer"
              >
                Browse destinations
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="text-xs font-bold text-white hover:text-brand-saffron transition-all flex items-center gap-1 cursor-pointer"
              >
                Learn more →
              </button>
            </div>
          </div>

          <div className="md:col-span-5 h-64 md:h-full min-h-[300px] relative">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop"
              alt="Himalayan Sherpa Trekking"
              className="absolute inset-0 w-full h-full object-cover"
              onError={e => { e.currentTarget.src = '/nepal-bg.jpg'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f172a, transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── SECTION 6: NEWSLETTER ── */}
      <section className="py-24 bg-slate-100/50 border-t border-slate-100">
        <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm">
          <div className="md:col-span-7 flex flex-col gap-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-slate tracking-tight">
              The Nepal trip brief — straight from the trails
            </h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-md">
              Weekly: permit rule changes, which passes are open, when snow hits the high routes, first-hand lodge reports from guides who walked that week. No tourism board spin — just what's actually happening up there.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mt-4 max-w-lg">
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all text-slate-800"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-blue/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Subscribe
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {subscribed && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-green font-bold text-xs flex items-center gap-1.5 mt-2"
              >
                <ShieldCheck className="w-4 h-4" /> Thank you! You've subscribed to the Yaatri newsletter.
              </motion.p>
            )}
          </div>

          <div className="md:col-span-5 h-64 md:h-72 rounded-2xl overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=800&auto=format&fit=crop"
              alt="Phewa Lake Nepal"
              className="absolute inset-0 w-full h-full object-cover"
              onError={e => { e.currentTarget.src = '/nepal-bg.jpg'; }}
            />
          </div>
        </div>
        </div>
      </section>

    </div>
  );
}
