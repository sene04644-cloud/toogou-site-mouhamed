import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, ShoppingCart, Phone, Truck, CheckCircle, 
  Trash2, Loader2, ArrowRight, Plus, Minus, CreditCard, Smartphone, Edit, ImageIcon, Settings, Lock, User, X, LogOut, ShieldCheck, Download
} from 'lucide-react';

// ASPIRATEUR DU LOGO (Assure-toi que logo.png est bien présent dans le dossier src)
import monLogo from './logo.png';

// ==========================================
// MOTEUR CLOUD (FIREBASE)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const isCanvasEnv = typeof __firebase_config !== 'undefined';
const monFirebaseConfig = { apiKey: "REMPLACE_CA", authDomain: "REMPLACE_CA", projectId: "REMPLACE_CA", storageBucket: "REMPLACE_CA", messagingSenderId: "REMPLACE_CA", appId: "REMPLACE_CA" };
const hasFirebaseConfig = isCanvasEnv || monFirebaseConfig.apiKey !== "REMPLACE_CA";

let app: any, auth: any, db: any;
if (hasFirebaseConfig) {
  app = initializeApp(isCanvasEnv ? JSON.parse((window as any).__firebase_config) : monFirebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'toggou-app';
const getCol = (name: string) => isCanvasEnv ? collection(db, 'artifacts', appId, 'public', 'data', name) : collection(db, name);

// ==========================================
// INJECTION DES SCRIPTS (TAILWIND + JSPDF)
// ==========================================
if (typeof document !== 'undefined') {
  if (!document.getElementById('tailwind-cdn')) {
    const s = document.createElement('script'); s.id = 'tailwind-cdn'; s.src = 'https://cdn.tailwindcss.com'; document.head.appendChild(s);
  }
  if (!document.getElementById('jspdf-cdn')) {
    const s = document.createElement('script'); s.id = 'jspdf-cdn'; s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(s);
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    body { background-color: #fdfcf0; -webkit-tap-highlight-color: transparent; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(style);
}

const defaultWave = { link: "https://pay.wave.com/m/M_sn_gVXfYmT1RX3D/c/sn/", phone: "78 520 73 44" };
const defaultSecurity = { username: "Mouhamed", password: "1234" };
const defaultProduct = { id: 'main', name: "Le Nokoss Royal", price: 7500, description: "Le secret d'un assaisonnement parfait fait maison. Ingrédients 100% naturels pour vos plats.", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800" };

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('home');
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [waveConfig, setWaveConfig] = useState(defaultWave);
  const [adminCreds, setAdminCreds] = useState(defaultSecurity);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // LOGIQUE DU CLIC SECRET (5 clics sur le logo citron)
  const logoClicks = useRef(0);
  const handleLogoTrigger = () => {
    logoClicks.current += 1;
    if (logoClicks.current >= 5) {
      logoClicks.current = 0;
      setLoginForm({ username: '', password: '' });
      setLoginError(false);
      setShowLogin(true);
    }
    setTimeout(() => { logoClicks.current = 0; }, 3000);
  };

  // Firebase Auth
  useEffect(() => {
    if (!hasFirebaseConfig) return;
    const init = async () => {
      try {
        if ((window as any).__initial_auth_token) await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error(e); }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Sync Data
  useEffect(() => {
    if (hasFirebaseConfig && user) {
      const u1 = onSnapshot(getCol('products'), (s) => setProducts(s.docs.length>0 ? s.docs.map(d=>({id:d.id, ...d.data()})) : [defaultProduct]));
      const u2 = onSnapshot(getCol('orders'), (s) => setOrders(s.docs.map(d=>({id:d.id, ...d.data()})).sort((a:any,b:any)=>b.createdAt-a.createdAt)));
      const u3 = onSnapshot(getCol('gallery'), (s) => setGallery(s.docs.map(d=>({id:d.id, ...d.data()})).sort((a:any,b:any)=>b.createdAt-a.createdAt)));
      const u4 = onSnapshot(doc(getCol('settings'), 'wave_config'), (d) => d.exists() && setWaveConfig(d.data() as any));
      const u5 = onSnapshot(doc(getCol('settings'), 'admin_creds'), (d) => { if (d.exists()) setAdminCreds(d.data() as any); setLoading(false); });
      return () => { u1(); u2(); u3(); u4(); u5(); };
    } else if (!hasFirebaseConfig) {
      setOrders(JSON.parse(localStorage.getItem('t_orders') || '[]'));
      setGallery(JSON.parse(localStorage.getItem('t_gallery') || '[]'));
      setProducts(JSON.parse(localStorage.getItem('t_prods') || JSON.stringify([defaultProduct])));
      setWaveConfig(JSON.parse(localStorage.getItem('t_wave') || JSON.stringify(defaultWave)));
      setAdminCreds(JSON.parse(localStorage.getItem('t_creds') || JSON.stringify(defaultSecurity)));
      setTimeout(() => setLoading(false), 800);
    }
  }, [user]);

  const addToCart = (product: any, qty: number) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...product, quantity: qty }];
    });
    setView('cart');
  };

  const handleLoginSubmit = (e: any) => {
    e.preventDefault();
    if (loginForm.username === adminCreds.username && loginForm.password === adminCreds.password) {
      setIsAdmin(true); setShowLogin(false); setView('home');
    } else {
      setLoginError(true);
    }
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#FDFCF0]"><Loader2 className="w-16 h-16 text-green-700 animate-spin mb-4" /><p className="font-black text-green-900 uppercase">Chargement...</p></div>;

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col font-sans text-gray-800">
      
      {/* LOGIN MODAL (Serrure Invisible) */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl border-t-[12px] border-yellow-500 relative">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X /></button>
            <div className="text-center mb-8">
              <div className="bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-100 text-yellow-600"><ShieldCheck size={40} /></div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Espace Privé</h2>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && <div className="bg-red-50 text-red-600 font-bold text-center p-3 rounded-xl text-sm animate-pulse">Accès refusé 🚫</div>}
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required placeholder="Identifiant" className="w-full bg-gray-50 border-2 border-gray-100 pl-12 p-4 rounded-2xl font-bold outline-none focus:border-yellow-500 transition" value={loginForm.username} onChange={e=>setLoginForm({...loginForm, username: e.target.value, error:false})} />
              </div>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="password" placeholder="Code secret" className="w-full bg-gray-50 border-2 border-gray-100 pl-12 p-4 rounded-2xl font-bold outline-none focus:border-yellow-500 transition" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password: e.target.value, error:false})} />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl uppercase mt-2 transform active:scale-95 transition">Déverrouiller</button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-[#006837] text-white p-3 md:p-4 sticky top-0 z-40 shadow-xl border-b-4 border-[#FFD700]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={handleLogoTrigger}>
            <div className="bg-white rounded-full w-12 h-12 border-2 border-[#FFD700] overflow-hidden shadow-lg flex-shrink-0">
              <img src={monLogo} className="w-full h-full object-cover" alt="Logo" onError={(e:any)=>e.target.style.display='none'} />
            </div>
            <div>
              <h1 className="font-black text-lg md:text-xl text-[#FFD700] uppercase tracking-tighter leading-none">Toggou Yaye Isseu</h1>
              <p className="text-[9px] font-bold uppercase text-green-200 mt-1 hidden sm:block tracking-widest">L'Excellence Culinaire</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setView('home')} className="hidden sm:block text-xs font-black uppercase hover:text-yellow-400 transition px-2">Boutique</button>
            <button onClick={() => setView('gallery')} className="hidden sm:block text-xs font-black uppercase hover:text-yellow-400 transition px-2">Photos</button>
            <button onClick={() => setView('cart')} className="relative bg-black/20 p-3 rounded-full hover:bg-black/30 transition">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-[#006837]">{cart.length}</span>}
            </button>
            {isAdmin && <button onClick={() => setIsAdmin(false)} className="bg-red-600 text-white p-2 md:px-3 md:py-2 rounded-xl text-xs font-black uppercase shadow-lg ml-2 flex items-center gap-1"><LogOut size={16}/> <span className="hidden md:inline">Quitter</span></button>}
          </div>
        </div>
      </header>

      {/* MAIN VIEW */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 py-8 md:py-12">
        {!isAdmin ? (
          <>
            {view === 'home' && <HomeView products={products} onAdd={addToCart} />}
            {view === 'gallery' && <GalleryView gallery={gallery} />}
            {view === 'cart' && <CartView cart={cart} setView={setView} setCart={setCart} />}
            {view === 'checkout' && <CheckoutView cart={cart} setView={setView} setCart={setCart} orders={orders} setOrders={setOrders} hasFirebase={hasFirebaseConfig} user={user} waveConfig={waveConfig} setLastOrder={setLastOrder} />}
            {view === 'success' && <SuccessView order={lastOrder} setView={setView} />}
            {view === 'wave-success' && <WaveSuccessView order={lastOrder} setView={setView} waveConfig={waveConfig} />}
          </>
        ) : (
          <AdminPanel orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} gallery={gallery} setGallery={setGallery} waveConfig={waveConfig} setWaveConfig={setWaveConfig} adminCreds={adminCreds} setAdminCreds={setAdminCreds} hasFirebase={hasFirebaseConfig} user={user} />
        )}
      </main>

      <footer className="bg-green-950 text-white/50 p-8 text-center border-t-8 border-[#FFD700] text-[10px] uppercase font-black tracking-widest">
        © {new Date().getFullYear()} Mouhamed • Créé au Sénégal
      </footer>
    </div>
  );
}

// ==========================================
// VUE : ACCUEIL (AVEC QUANTITÉ)
// ==========================================
function HomeView({ products, onAdd }: any) {
  if (products.length === 0) return <div className="text-center py-20 text-gray-400 font-bold italic animate-fade-in">"Vitrine vide pour le moment..."</div>;

  return (
    <div className="space-y-12 animate-fade-in">
      {products.map((p: any, i: number) => <ProductCard key={p.id} product={p} onAdd={onAdd} index={i} />)}
    </div>
  );
}

function ProductCard({ product, onAdd, index }: any) {
  const [qty, setQty] = useState(1);
  const isEven = index % 2 === 0;

  return (
    <div className={`bg-white rounded-[40px] shadow-2xl overflow-hidden border border-green-50 flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
      <div className="lg:w-1/2 h-72 lg:h-auto overflow-hidden relative bg-gray-100 flex items-center justify-center group">
        {product.image ? <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <ImageIcon size={64} className="text-gray-200" />}
        <div className={`absolute top-6 ${isEven ? 'left-6' : 'right-6'} bg-[#FFD700] text-green-900 font-black px-4 py-2 rounded-full text-[10px] uppercase shadow-lg border-2 border-white`}>Fait Maison</div>
      </div>
      <div className="lg:w-1/2 p-8 md:p-14 flex flex-col justify-center">
        <h2 className="text-4xl md:text-5xl font-black text-[#006837] mb-4 uppercase tracking-tighter leading-none">{product.name}</h2>
        <p className="text-gray-500 mb-8 italic text-lg leading-relaxed whitespace-pre-wrap">"{product.description}"</p>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="text-5xl font-black text-green-700 tracking-tighter">{Number(product.price).toLocaleString()} F</div>
          
          {/* SÉLECTEUR DE QUANTITÉ */}
          <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border-2 border-gray-100 self-start sm:self-auto">
            <button onClick={()=>setQty(Math.max(1, qty-1))} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-green-800 hover:bg-gray-100 transition"><Minus size={20}/></button>
            <span className="w-12 text-center font-black text-2xl text-green-950">{qty}</span>
            <button onClick={()=>setQty(qty+1)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-green-800 hover:bg-gray-100 transition"><Plus size={20}/></button>
          </div>
        </div>
        
        <button onClick={()=>{onAdd(product, qty); setQty(1);}} className="w-full bg-[#006837] text-white font-black py-6 rounded-[30px] shadow-xl transform active:scale-95 transition text-xl uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-800">
          <ShoppingBag size={24}/> Ajouter au panier
        </button>
      </div>
    </div>
  );
}

// ==========================================
// VUE : GALERIE
// ==========================================
function GalleryView({ gallery }: any) {
  return (
    <div className="animate-fade-in space-y-12">
      <h2 className="text-4xl font-black text-[#006837] uppercase tracking-tighter text-center underline decoration-yellow-400 decoration-4 underline-offset-8">Nos Plats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery.map((img: any) => (
          <div key={img.id} className="aspect-square rounded-[30px] overflow-hidden border-4 border-white shadow-xl hover:scale-105 transition"><img src={img.url} className="w-full h-full object-cover" /></div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// VUE : PANIER
// ==========================================
function CartView({ cart, setView, setCart }: any) {
  const total = cart.reduce((s:any,i:any)=>s+i.price*i.quantity,0);
  if (cart.length === 0) return <div className="text-center py-24 bg-white rounded-[40px] shadow-2xl"><ShoppingCart size={80} className="mx-auto text-gray-200 mb-6"/><h2 className="text-3xl font-black text-gray-300 uppercase italic">Panier vide</h2><button onClick={()=>setView('home')} className="mt-10 bg-green-800 text-white px-12 py-5 rounded-[25px] uppercase font-black shadow-lg">Retour Vitrine</button></div>;
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden animate-fade-in border border-green-50">
      <div className="p-8 bg-green-50 border-b flex justify-between items-center"><h3 className="font-black text-green-900 uppercase text-2xl tracking-tighter">Mon Panier</h3><button onClick={()=>setCart([])} className="text-red-500 font-bold text-xs uppercase flex items-center gap-1 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={14}/> Vider tout</button></div>
      <div className="p-8 space-y-6">
        {cart.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-6">
            <div className="flex items-center gap-4">
               <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-gray-100">{item.image && <img src={item.image} className="w-full h-full object-cover" />}</div>
               <div><p className="font-black text-xl text-gray-800 uppercase leading-none">{item.name}</p><p className="text-green-700 font-bold mt-1 text-sm">{item.quantity} pot(s) x {Number(item.price).toLocaleString()} F</p></div>
            </div>
            <div className="font-black text-2xl text-green-900 tracking-tighter">{(item.quantity * item.price).toLocaleString()} F</div>
          </div>
        ))}
      </div>
      <div className="p-10 bg-[#FFD700] flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
        <div><p className="text-[11px] font-black opacity-60 uppercase mb-1">Montant à régler</p><p className="text-6xl font-black text-green-950 tracking-tighter">{total.toLocaleString()} FCFA</p></div>
        <button onClick={()=>setView('checkout')} className="w-full md:w-auto bg-green-950 text-white font-black px-12 py-6 rounded-[30px] shadow-2xl uppercase tracking-widest text-xl flex items-center justify-center gap-4 transition transform active:scale-95 hover:bg-black">Passer commande <ArrowRight/></button>
      </div>
    </div>
  );
}

// ==========================================
// VUE : CHECKOUT (VALIDATION)
// ==========================================
function CheckoutView({ cart, setView, setCart, orders, setOrders, hasFirebase, user, waveConfig, setLastOrder }: any) {
  const [f, setF] = useState({n:'', p:'', a:''});
  const [m, setM] = useState('wave');
  const [isValidating, setIsValidating] = useState(false);
  const total = cart.reduce((s:any,i:any)=>s+i.price*i.quantity,0);

  const done = async (e: any) => {
    e.preventDefault();
    setIsValidating(true);
    const newOrder = { id: Date.now().toString(), customer: f, items: cart, total: total, method: m, status: m === 'wave' ? 'Vérif Wave' : 'Validée', createdAt: Date.now(), displayId: `TI-${Math.floor(Math.random()*90000)+10000}` };
    setLastOrder(newOrder);
    
    setTimeout(async () => {
      if (hasFirebase && user) await setDoc(doc(getCol('orders'), newOrder.id), newOrder);
      else { const up = [newOrder, ...orders]; setOrders(up); localStorage.setItem('t_orders', JSON.stringify(up)); }
      
      setCart([]);
      if (m === 'wave') { window.open(waveConfig.link, '_blank'); setView('wave-success'); }
      else setView('success');
    }, 2000);
  };

  if (isValidating) return (
    <div className="fixed inset-0 bg-[#006837] flex flex-col items-center justify-center z-[9999] text-white p-8">
      <Loader2 className="w-20 h-20 animate-spin mb-6 text-[#FFD700]" />
      <h2 className="text-4xl font-black uppercase tracking-tighter">Vérification...</h2>
      <p className="text-green-200 font-bold mt-4 uppercase text-[10px] tracking-widest">Enregistrement sécurisé en cours</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[45px] shadow-2xl overflow-hidden border-t-[16px] border-[#006837] animate-fade-in">
      <div className="p-8 text-center bg-green-50 border-b"><h2 className="font-black text-green-900 uppercase text-3xl tracking-tighter">Livraison</h2></div>
      <form onSubmit={done} className="p-8 space-y-6">
        <div className="space-y-4">
           <input required placeholder="Nom Complet" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-green-500 transition text-lg" value={f.n} onChange={e=>setF({...f, n: e.target.value})} />
           <input required type="tel" placeholder="Numéro de Téléphone" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-green-500 transition text-lg" value={f.p} onChange={e=>setF({...f, p: e.target.value})} />
           <textarea required placeholder="Adresse exacte (Quartier, N°...)" className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-3xl font-bold outline-none focus:border-green-500 transition h-32 resize-none text-lg" value={f.a} onChange={e=>setF({...f, a: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div onClick={()=>setM('wave')} className={`p-6 rounded-3xl border-4 cursor-pointer text-center transition-all ${m==='wave'?'border-blue-500 bg-blue-50 scale-105 shadow-md':'border-gray-50 opacity-40 grayscale'}`}><span className="text-3xl font-black italic text-blue-600 block mb-1">Wave</span><span className="text-[9px] font-black uppercase text-blue-400">Mobile Money</span></div>
           <div onClick={()=>setM('delivery')} className={`p-6 rounded-3xl border-4 cursor-pointer transition flex flex-col items-center justify-center ${m==='delivery'?'border-green-500 bg-green-50 scale-105 shadow-md':'border-gray-50 opacity-40 grayscale'}`}><Truck className="text-green-700" size={32}/><span className="text-[10px] font-black uppercase mt-1">À la livraison</span></div>
        </div>
        <button type="submit" className="w-full bg-green-950 hover:bg-black text-white font-black py-7 rounded-[35px] shadow-2xl text-2xl uppercase tracking-widest transform active:scale-95 transition mt-6">Confirmer</button>
      </form>
    </div>
  );
}

// ==========================================
// MOTEUR PDF (GÉNÉRATION FACTURE PRO)
// ==========================================
const genererFacture = (order: any) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  
  // Bandeau Vert Header
  doc.setFillColor(0, 104, 55); 
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24); doc.setFont("helvetica", "bold"); 
  doc.text("TOGGOU YAYE ISSEU", 20, 25);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); 
  doc.text("L'Excellence Culinaire Sénégalaise", 20, 33);
  
  // Titre Facture
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("FACTURE CLIENT", 20, 65);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(`Réf: ${order.displayId}`, 20, 75);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 20, 81);
  
  // Infos Client
  doc.setFont("helvetica", "bold"); doc.text("DESTINATAIRE :", 120, 65);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom: ${order.customer.n.toUpperCase()}`, 120, 75);
  doc.text(`Tél: ${order.customer.p}`, 120, 81);
  doc.text(`Lieu: ${order.customer.a}`, 120, 87);
  
  // Tableau des articles
  doc.setDrawColor(200, 200, 200); doc.line(20, 100, 190, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Désignation", 20, 108); doc.text("Qté", 140, 108); doc.text("Total (F)", 170, 108);
  doc.line(20, 112, 190, 112);
  
  doc.setFont("helvetica", "normal");
  let y = 122;
  order.items.forEach((it: any) => {
    doc.text(it.name, 20, y); 
    doc.text(it.quantity.toString(), 140, y); 
    doc.text((it.price * it.quantity).toLocaleString(), 170, y);
    y += 10;
  });
  
  doc.line(20, y, 190, y);
  
  // Total Final
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 104, 55);
  doc.text(`TOTAL A PAYER : ${order.total.toLocaleString()} FCFA`, 100, y + 15);
  
  // Footer
  doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
  doc.text("Document généré automatiquement. Merci pour votre achat !", 105, 285, {align:"center"});
  
  doc.save(`Facture_${order.displayId}.pdf`);
};

// ==========================================
// VUE : SUCCÈS
// ==========================================
function SuccessView({ order, setView }: any) {
  return (
    <div className="max-w-xl mx-auto p-4 animate-fade-in text-center">
      <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border-b-[16px] border-green-800 p-10">
        <div className="bg-green-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 text-green-600"><CheckCircle size={60} /></div>
        <h2 className="text-4xl font-black text-green-900 uppercase tracking-tighter leading-none">COMMANDE<br/>VALIDÉE</h2>
        
        <div className="my-10 bg-gray-50 p-8 rounded-[35px] border-4 border-dashed border-gray-200">
           <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Référence Unique</p>
           <p className="text-4xl font-black text-gray-800 tracking-tighter">{order?.displayId}</p>
        </div>

        <div className="grid gap-4">
           <button onClick={() => genererFacture(order)} className="w-full flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black py-5 rounded-[25px] border-2 border-blue-200 transition active:scale-95"><Download size={22}/> Télécharger la Facture PDF</button>
           <button onClick={()=>setView('home')} className="w-full bg-green-950 text-white font-black py-6 rounded-[25px] uppercase transition transform active:scale-95 text-lg shadow-xl">Retour Boutique</button>
        </div>
      </div>
    </div>
  );
}

function WaveSuccessView({ order, setView, waveConfig }: any) {
  return (
    <div className="max-w-xl mx-auto p-4 animate-fade-in text-center">
      <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border-4 border-blue-500 p-10">
        <Smartphone size={70} className="mx-auto mb-6 animate-bounce text-blue-600" />
        <h2 className="text-4xl font-black text-blue-800 uppercase tracking-tighter leading-none">EN ATTENTE<br/>DE PAIEMENT</h2>
        <div className="my-8 bg-blue-50 p-8 rounded-[30px] border-2 border-blue-100"><p className="text-gray-500 font-bold text-[10px] uppercase mb-1">Montant à envoyer via Wave :</p><p className="text-6xl font-black text-blue-700 tracking-tighter">{order?.total.toLocaleString()} F</p></div>
        <div className="bg-gray-50 p-8 rounded-[30px] border-4 border-dashed border-gray-200 mb-8"><p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">Si l'application ne s'ouvre pas, envoyez au :</p><p className="text-4xl font-black text-gray-800 tracking-widest">{waveConfig.phone}</p></div>
        
        <div className="grid gap-4">
          <button onClick={() => genererFacture(order)} className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-black py-5 rounded-[25px] border-2 border-gray-200 transition"><Download size={20}/> Obtenir Facture PDF</button>
          <button onClick={()=>setView('home')} className="w-full bg-blue-600 text-white font-black py-6 rounded-[25px] shadow-xl uppercase transform active:scale-95 transition text-lg">J'ai effectué le paiement</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VUE : ADMIN PANEL COMPLET
// ==========================================
function AdminPanel({ orders, setOrders, products, setProducts, gallery, setGallery, waveConfig, setWaveConfig, adminCreds, setAdminCreds, hasFirebase, user }: any) {
  const [tab, setTab] = useState('orders');
  const [editing, setEditing] = useState<any>(null);
  const [editWave, setEditWave] = useState(waveConfig);
  const [editCreds, setEditCreds] = useState(adminCreds);

  const updStatus = async (id:string, s:string) => {
    const o = orders.find((x:any)=>x.id===id);
    if(hasFirebase && user) await setDoc(doc(getCol('orders'), id), {...o, status: s});
    else { const up = orders.map((x:any)=>x.id===id?{...x, status:s}:x); setOrders(up); localStorage.setItem('t_orders', JSON.stringify(up)); }
  };
  const saveProd = async () => {
    const n = editing.id ? editing : {...editing, id:Date.now().toString()};
    if(hasFirebase && user) await setDoc(doc(getCol('products'), n.id), n);
    else { let up = editing.id?products.map((p:any)=>p.id===n.id?n:p):[n,...products]; setProducts(up); localStorage.setItem('t_prods', JSON.stringify(up)); }
    setEditing(null); alert("Plat enregistré avec succès !");
  };
  const delProd = async (id:string) => { if(!window.confirm("Confirmez-vous la suppression de ce plat ?")) return; if(hasFirebase && user) await deleteDoc(doc(getCol('products'), id)); else { const up = products.filter((p:any)=>p.id!==id); setProducts(up); localStorage.setItem('t_prods', JSON.stringify(up)); } };
  const addPhoto = async (u:string) => { const n = { id:Date.now().toString(), url:u, createdAt:Date.now() }; if(hasFirebase && user) await setDoc(doc(getCol('gallery'), n.id), n); else { const up = [n,...gallery]; setGallery(up); localStorage.setItem('t_gallery', JSON.stringify(up)); } alert("Photo ajoutée !"); };
  const delPhoto = async (id:string) => { if(hasFirebase && user) await deleteDoc(doc(getCol('gallery'), id)); else { const up = gallery.filter((img:any)=>img.id!==id); setGallery(up); localStorage.setItem('t_gallery', JSON.stringify(up)); } };
  const saveSets = async () => {
    if(hasFirebase && user) { await setDoc(doc(getCol('settings'), 'wave_config'), editWave); await setDoc(doc(getCol('settings'), 'admin_creds'), editCreds); }
    else { setWaveConfig(editWave); setAdminCreds(editCreds); localStorage.setItem('t_wave', JSON.stringify(editWave)); localStorage.setItem('t_creds', JSON.stringify(editCreds)); }
    alert("Paramètres enregistrés et sécurisés !");
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex bg-gray-200 p-2 rounded-[30px] space-x-2 sticky top-[80px] z-40 shadow-xl border-4 border-white overflow-x-auto hide-scrollbar">
        <button onClick={()=>setTab('orders')} className={`flex-1 min-w-[100px] py-4 rounded-[20px] font-black text-[10px] uppercase transition ${tab==='orders'?'bg-white shadow text-green-800':'text-gray-500'}`}>Commandes</button>
        <button onClick={()=>setTab('prod')} className={`flex-1 min-w-[100px] py-4 rounded-[20px] font-black text-[10px] uppercase transition ${tab==='prod'?'bg-white shadow text-green-800':'text-gray-500'}`}>Produits</button>
        <button onClick={()=>setTab('gal')} className={`flex-1 min-w-[100px] py-4 rounded-[20px] font-black text-[10px] uppercase transition ${tab==='gal'?'bg-white shadow text-green-800':'text-gray-500'}`}>Photos</button>
        <button onClick={()=>setTab('sets')} className={`flex-1 min-w-[100px] py-4 rounded-[20px] font-black text-[10px] uppercase transition ${tab==='sets'?'bg-blue-600 shadow text-white':'text-gray-500'}`}>Paramètres</button>
      </div>

      {tab==='orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[30px] shadow border-l-8 border-green-500"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Chiffre d'Affaire</p><p className="text-2xl font-black text-green-800">{orders.reduce((a:any,o:any)=>o.status==='Livrée'?a+o.total:a,0).toLocaleString()} F</p></div>
             <div className="bg-white p-6 rounded-[30px] shadow border-l-8 border-yellow-500"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Attente / Wave</p><p className="text-2xl font-black text-yellow-600">{orders.filter((o:any)=>o.status==='Validée'||o.status==='Vérif Wave').length}</p></div>
          </div>
          {orders.map((o:any)=>(
            <div key={o.id} className="bg-white p-6 rounded-[35px] shadow-sm flex flex-col md:flex-row justify-between gap-4 border border-gray-50">
              <div className="space-y-2">
                <div className="flex gap-2 mb-1"><span className="bg-gray-100 text-[9px] font-black px-3 py-1 rounded-full text-gray-400">{o.displayId}</span><span className={`text-[9px] font-black px-3 py-1 rounded-full ${o.status==='Validée'?'bg-green-100 text-green-700':o.status==='Livrée'?'bg-green-600 text-white':'bg-blue-100 text-blue-700'}`}>{o.status}</span></div>
                <p className="font-black text-2xl text-gray-800 uppercase tracking-tighter leading-none">{o.customer.n}</p>
                <div className="text-sm font-bold text-gray-500">📞 {o.customer.p} | 📍 {o.customer.a}</div>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-0 pt-4 md:pt-0">
                <p className="font-black text-3xl text-green-900 tracking-tighter">{o.total.toLocaleString()} F</p>
                <select value={o.status} onChange={e=>updStatus(o.id, e.target.value)} className="bg-green-800 text-white p-3 px-5 rounded-xl font-black text-[10px] uppercase outline-none shadow-md cursor-pointer"><option value="Validée">Validée (Auto)</option><option value="Vérif Wave">Vérif Wave</option><option value="Livrée">Livrée</option><option value="Annulée">Annulée</option></select>
              </div>
            </div>
          ))}
          {orders.length===0 && <p className="text-center text-gray-400 font-bold py-16">Aucune commande pour l'instant.</p>}
        </div>
      )}

      {tab==='prod' && (
        <div className="space-y-6">
          <button onClick={()=>setEditing({name:'',price:0,description:'',image:''})} className="bg-green-800 text-white font-black py-4 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-sm w-full md:w-auto"><Plus size={18} /> Ajouter un nouveau produit</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {products.map((p:any)=>(
                <div key={p.id} className="bg-white p-4 rounded-[30px] shadow border border-gray-50 flex items-center gap-4">
                   <div className="w-20 h-20 bg-gray-100 rounded-[20px] overflow-hidden border">{p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-5 text-gray-200"/>}</div>
                   <div className="flex-1 min-w-0"><p className="font-black text-gray-800 uppercase truncate text-sm">{p.name}</p><p className="text-green-700 font-black text-lg">{Number(p.price).toLocaleString()} F</p></div>
                   <div className="flex gap-2"><button onClick={()=>setEditing(p)} className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Edit size={18}/></button><button onClick={()=>delProd(p.id)} className="bg-red-50 text-red-600 p-3 rounded-xl"><Trash2 size={18}/></button></div>
                </div>
             ))}
          </div>
        </div>
      )}

      {tab==='gal' && (
        <div className="bg-white p-8 rounded-[40px] shadow-2xl space-y-8 animate-fade-in">
           <div className="border-4 border-dashed border-green-100 p-12 text-center relative rounded-[35px] cursor-pointer hover:bg-green-50 transition-all">
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=(ev:any)=>addPhoto(ev.target.result); r.readAsDataURL(f);}}} />
              <div className="flex flex-col items-center"><div className="bg-green-100 p-5 rounded-full mb-4 text-green-700 shadow-inner"><Plus size={32} /></div><p className="font-black text-green-900 uppercase text-lg">Ajouter une photo à la Galerie</p></div>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((img:any)=>(
                <div key={img.id} className="relative aspect-square rounded-[25px] overflow-hidden border-2 border-gray-100 group"><img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" /><button onClick={()=>delPhoto(img.id)} className="absolute top-2 right-2 bg-white/90 text-red-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button></div>
              ))}
           </div>
        </div>
      )}

      {tab==='sets' && (
        <div className="space-y-8 animate-fade-in max-w-lg mx-auto">
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-t-8 border-blue-600">
            <h3 className="text-xl font-black text-blue-900 uppercase flex items-center gap-2 mb-6"><Smartphone size={24}/> Configurations Wave</h3>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Lien URL Wave Business</label><input className="w-full bg-gray-50 border-4 border-gray-50 focus:border-blue-300 p-4 rounded-2xl font-bold text-xs outline-none transition" value={editWave.link} onChange={e=>setEditWave({...editWave, link: e.target.value})} placeholder="https://pay.wave.com/..." /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Numéro Wave de Réception</label><input className="w-full bg-gray-50 border-4 border-gray-50 focus:border-blue-300 p-4 rounded-2xl font-black text-xl outline-none transition" value={editWave.phone} onChange={e=>setEditWave({...editWave, phone: e.target.value})} placeholder="Numéro..." /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-t-8 border-gray-900">
            <h3 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2 mb-6"><Lock size={24}/> Sécurité de l'Espace Chef</h3>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Nom d'Utilisateur secret</label><input className="w-full bg-gray-50 border-4 border-gray-50 focus:border-gray-300 p-4 rounded-2xl font-black outline-none transition" value={editCreds.username} onChange={e=>setEditCreds({...editCreds, username: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Code Secret (Mot de Passe)</label><input className="w-full bg-gray-50 border-4 border-gray-50 focus:border-gray-300 p-4 rounded-2xl font-black outline-none transition" value={editCreds.password} onChange={e=>setEditCreds({...editCreds, password: e.target.value})} /></div>
            </div>
          </div>
          <button onClick={saveSets} className="w-full bg-green-950 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-lg transform active:scale-95 transition hover:bg-black">Sauvegarder les paramètres</button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-white z-[100] p-6 flex flex-col space-y-6 overflow-y-auto animate-slide-in">
           <div className="flex justify-between items-center"><h2 className="text-3xl font-black uppercase text-green-900">Configuration Produit</h2><button onClick={()=>setEditing(null)} className="p-3 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition"><X/></button></div>
           <div className="flex flex-col items-center">
             <div className="relative w-48 h-48 bg-gray-50 rounded-[45px] border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2 group cursor-pointer">{editing.image ? <img src={editing.image} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-gray-300" />}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=(ev:any)=>setEditing({...editing, image:ev.target.result}); r.readAsDataURL(f);}}} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
             <p className="text-[10px] font-black text-gray-400 uppercase">Toucher pour ajouter/changer l'image</p>
           </div>
           <div className="space-y-4 flex-1">
              <input className="w-full border-b-4 border-gray-100 p-4 text-2xl font-black outline-none focus:border-green-600 transition" value={editing.name} onChange={e=>setEditing({...editing, name: e.target.value})} placeholder="Nom du produit" />
              <input type="number" className="w-full border-b-4 border-gray-100 p-4 text-3xl font-black outline-none text-green-700 focus:border-green-600 transition" value={editing.price} onChange={e=>setEditing({...editing, price: Number(e.target.value)})} placeholder="Prix en FCFA" />
              <textarea className="w-full bg-gray-50 p-6 rounded-[35px] font-bold outline-none border-2 border-gray-100 h-40 resize-none focus:border-green-600 transition" value={editing.description} onChange={e=>setEditing({...editing, description: e.target.value})} placeholder="Description détaillée..." />
           </div>
           <button onClick={saveProd} className="w-full bg-green-900 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase text-xl transform active:scale-95 transition hover:bg-black">Enregistrer ce produit</button>
        </div>
      )}
    </div>
  );
}