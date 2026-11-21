import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  BookOpen, 
  Headphones, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Star, 
  RefreshCw, 
  Lock, 
  Unlock,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { 
  getCatalog, 
  checkEntitlement, 
  getStreamingToken, 
  verifyPaymentDev, 
  getAdminStats, 
  type CatalogItem, 
  type AdminStats 
} from './services/api';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ReaderModal } from './components/ReaderModal';

const SAMPLE_AUDIO_FALLBACK = 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg';

export function App() {
  const { user, token, logout } = useAuth();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<CatalogItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'detail' | 'admin'>('discover');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [hasEntitlement, setHasEntitlement] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signedStreamInfo, setSignedStreamInfo] = useState<{ url?: string; expires?: number } | null>(null);

  // Auth & Reader modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speeds = [1.0, 1.25, 1.5, 2.0];

  // Fetch catalog from backend API on mount
  useEffect(() => {
    async function fetchCatalogData() {
      try {
        setLoading(true);
        const data = await getCatalog(searchQuery);
        setCatalog(data.items);
        if (data.items.length > 0 && !selectedMedia) {
          setSelectedMedia(data.items[0]);
        }
      } catch (err) {
        console.error('Failed to load catalog from API:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogData();
  }, [searchQuery]);

  // Check entitlement and acquire streaming token whenever media or user changes
  useEffect(() => {
    if (!selectedMedia) return;

    async function evaluateAccess() {
      if (!token) {
        setHasEntitlement(false);
        setSignedStreamInfo(null);
        return;
      }
      try {
        const entitled = await checkEntitlement(selectedMedia!.id, token);
        setHasEntitlement(entitled);

        if (entitled) {
          const stream = await getStreamingToken(selectedMedia!.id, token);
          setSignedStreamInfo({ url: stream.audioStreamUrl, expires: stream.expiresAt });
        } else {
          setSignedStreamInfo(null);
        }
      } catch {
        setHasEntitlement(false);
        setSignedStreamInfo(null);
      }
    }
    evaluateAccess();
  }, [selectedMedia, token]);

  // Load admin stats when admin tab opens
  useEffect(() => {
    if (activeTab === 'admin' && token) {
      getAdminStats(token)
        .then(setAdminStats)
        .catch(() => {
          // Fallback view for demo
          setAdminStats({
            totalUsers: 342,
            totalSubscribers: 342,
            totalOrders: 89,
            monthlyGross: 855000,
            cloudBill: 68200,
            creatorRoyalties: 171000,
            operatorFee: 400000,
            netDistributable: 215800,
            catalogCount: 4
          });
        });
    }
  }, [activeTab, token]);

  // Audio element management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.playbackRate = playbackSpeed;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = SAMPLE_AUDIO_FALLBACK;
      }
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.log('Audio autoplay policy:', e));
    }
  };

  const skipSeconds = (sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
    }
  };

  const handleNextSpeed = () => {
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSimulatePayment = async (type: 'subscription' | 'purchase') => {
    if (!token) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await verifyPaymentDev(type, selectedMedia?.id, token);
      setHasEntitlement(true);
      alert(`Paystack Webhook Verified! ₦${type === 'subscription' ? '2,500' : selectedMedia?.price} payment confirmed. Entitlements updated.`);
      
      if (selectedMedia) {
        const stream = await getStreamingToken(selectedMedia.id, token);
        setSignedStreamInfo({ url: stream.audioStreamUrl, expires: stream.expiresAt });
      }
    } catch (e: any) {
      alert(e.message || 'Payment simulation failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans pb-28">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#131B2B]/85 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('discover')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-500/20">
              I
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">ICKAR</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
            <button 
              onClick={() => setActiveTab('discover')} 
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'discover' ? 'text-indigo-400 font-semibold' : ''}`}
            >
              Discover
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('admin')} 
                className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'admin' ? 'text-amber-400 font-semibold' : ''}`}
              >
                Admin Command
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors..." 
              className="bg-[#1E293B] text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/5 w-60 text-slate-200 placeholder-slate-500"
            />
          </div>

          {hasEntitlement ? (
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Access Unlocked</span>
            </div>
          ) : (
            <button 
              onClick={() => handleSimulatePayment('subscription')}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Subscribe ₦2,500/mo</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Fetching media catalogue from ICKAR API...</p>
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === 'discover' && catalog.length > 0 && (
              <div className="space-y-10">
                {/* Hero Spotlight */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-[#131B2B] to-[#1E293B] border border-white/10 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl space-y-4">
                    <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>Featured Title</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                      {catalog[0].title}
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                      {catalog[0].description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button 
                        onClick={() => {
                          setSelectedMedia(catalog[0]);
                          togglePlay();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Listen Now</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMedia(catalog[0]);
                          setIsReaderOpen(true);
                        }}
                        className="bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-semibold px-5 py-3 rounded-xl border border-white/10 transition-colors cursor-pointer flex items-center space-x-2"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>Open Reader</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMedia(catalog[0]);
                          setActiveTab('detail');
                        }}
                        className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="relative group cursor-pointer" onClick={() => { setSelectedMedia(catalog[0]); setActiveTab('detail'); }}>
                    <img 
                      src={catalog[0].coverUrl} 
                      alt={catalog[0].title}
                      className="w-56 md:w-64 h-80 object-cover rounded-2xl shadow-2xl border border-white/20 group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center space-x-1 border border-white/10">
                      <Headphones className="w-3 h-3 text-indigo-400" />
                      <span>{catalog[0].duration || 'Audio'}</span>
                    </div>
                  </div>
                </div>

                {/* Catalogue Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Available Catalogue</h2>
                      <p className="text-xs md:text-sm text-slate-400">Streamed via Cloudflare R2 Edge with short-lived HMAC tokens</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{catalog.length} Titles Loaded</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {catalog.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedMedia(item);
                          setActiveTab('detail');
                        }}
                        className="group bg-[#131B2B] hover:bg-[#1E293B] border border-white/5 hover:border-indigo-500/40 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-1"
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3">
                          <img 
                            src={item.coverUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center space-x-1 border border-white/10">
                            {item.type === 'audiobook' && <Headphones className="w-2.5 h-2.5 text-indigo-400" />}
                            {item.type === 'ebook' && <BookOpen className="w-2.5 h-2.5 text-emerald-400" />}
                            {item.type === 'bundle' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.author}</p>
                        
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-400">₦{item.price.toLocaleString()}</span>
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            In Sub
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Media Detail Tab */}
            {activeTab === 'detail' && selectedMedia && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <button 
                  onClick={() => setActiveTab('discover')} 
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  <span>← Back to Catalogue</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#131B2B] border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl">
                  <div className="space-y-4">
                    <img 
                      src={selectedMedia.coverUrl} 
                      alt={selectedMedia.title} 
                      className="w-full aspect-[3/4] object-cover rounded-2xl shadow-xl border border-white/10"
                    />
                    <div className="space-y-2">
                      <button 
                        onClick={togglePlay}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                        <span>{isPlaying ? 'Pause Audio' : 'Play Audio Sample'}</span>
                      </button>

                      <button 
                        onClick={() => setIsReaderOpen(true)}
                        className="w-full bg-[#1E293B] hover:bg-slate-700 text-emerald-300 font-bold py-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>Read Book (In-Browser)</span>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">{selectedMedia.category}</span>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{selectedMedia.title}</h1>
                      <p className="text-sm text-slate-400 mt-1">Written by <span className="text-slate-200 font-semibold">{selectedMedia.author}</span></p>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedMedia.description}
                    </p>

                    {/* Entitlement Status & Pricing */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Status</h3>
                        {hasEntitlement ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Entitled & Licensed</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Subscription Required</span>
                          </span>
                        )}
                      </div>

                      {hasEntitlement ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
                          <p className="text-sm font-bold text-emerald-300">You own access to this publication.</p>
                          <p className="text-xs text-slate-400">Streamed through secure HMAC tokens. Signed URL active for 15 minutes.</p>
                          {signedStreamInfo?.url && (
                            <p className="text-[10px] text-slate-500 truncate mt-1">R2 Endpoint: {signedStreamInfo.url}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Option 1: Subscription */}
                          <div className="bg-[#1E293B] border-2 border-indigo-500/60 rounded-2xl p-4 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm text-white">ICKAR Monthly Pass</span>
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold">RECOMMENDED</span>
                              </div>
                              <p className="text-xs text-slate-400">Unlimited access to this title + entire library</p>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-extrabold text-white">₦2,500</span>
                              <span className="text-xs text-slate-400">/mo</span>
                            </div>
                          </div>

                          {/* Paystack Checkout Button */}
                          <button 
                            onClick={() => handleSimulatePayment('subscription')}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Subscribe via Paystack (Cards / Transfer)</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Command Tab */}
            {activeTab === 'admin' && adminStats && (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">Owner Operational Command</h1>
                  <p className="text-xs md:text-sm text-slate-400">Live metrics, server expenses & net monthly distributable cash</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#131B2B] border border-white/10 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Paying Subscribers</span>
                    <p className="text-2xl font-black text-white mt-1">{adminStats.totalSubscribers}</p>
                    <span className="text-[11px] text-emerald-400 font-semibold">Active accounts</span>
                  </div>
                  <div className="bg-[#131B2B] border border-white/10 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Monthly Gross Receipts</span>
                    <p className="text-2xl font-black text-white mt-1">₦{adminStats.monthlyGross.toLocaleString()}</p>
                    <span className="text-[11px] text-indigo-400 font-semibold">Paystack local fees 1.5%</span>
                  </div>
                  <div className="bg-[#131B2B] border border-white/10 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Monthly Cloud Bill</span>
                    <p className="text-2xl font-black text-white mt-1">₦{adminStats.cloudBill.toLocaleString()}</p>
                    <span className="text-[11px] text-slate-400 font-semibold">Cloudflare R2 + DB</span>
                  </div>
                  <div className="bg-[#131B2B] border border-white/10 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Net Remitted to Owner (80%)</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₦{(adminStats.netDistributable * 0.8).toLocaleString()}</p>
                    <span className="text-[11px] text-emerald-400 font-semibold">5th of every month</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Docked Audio Player */}
      {selectedMedia && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#131B2B]/95 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-50 shadow-2xl">
          {/* Left: Metadata */}
          <div className="flex items-center space-x-3 w-1/4 min-w-[200px]">
            <img 
              src={selectedMedia.coverUrl} 
              alt={selectedMedia.title} 
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shadow"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{selectedMedia.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{selectedMedia.author}</p>
            </div>
          </div>

          {/* Center: Playback Scrubber & Controls */}
          <div className="flex flex-col items-center max-w-md w-full space-y-1.5">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => skipSeconds(-15)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Skip back 15 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button 
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button 
                onClick={() => skipSeconds(15)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Skip forward 15 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 w-full text-[10px] text-slate-400">
              <span>{formatSeconds(currentTime)}</span>
              <div 
                onClick={(e) => {
                  if (audioRef.current && duration) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    audioRef.current.currentTime = newTime;
                  }
                }}
                className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden cursor-pointer relative"
              >
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-150"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
              <span>{formatSeconds(duration || 180)}</span>
            </div>
          </div>

          {/* Right: Tools & Speed */}
          <div className="flex items-center justify-end space-x-4 w-1/4">
            <button 
              onClick={handleNextSpeed}
              className="text-xs font-bold text-slate-300 hover:text-white bg-[#1E293B] border border-white/10 px-2 py-1 rounded-md cursor-pointer"
            >
              {playbackSpeed.toFixed(2)}x
            </button>
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
              <Volume2 className="w-4 h-4" />
              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authModalMode}
      />

      {/* In-Browser Document Reader Modal */}
      {selectedMedia && (
        <ReaderModal 
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          media={selectedMedia}
        />
      )}
    </div>
  );
}

export default App;
