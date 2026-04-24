import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, ShoppingCart, Truck, CheckCircle, 
  Plus, Minus, Smartphone, Download, ShieldCheck
} from 'lucide-react';

// LOGO
import monLogo from './logo.png';

// FIREBASE
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

const isCanvasEnv = typeof (window as any).__firebase_config !== 'undefined';
const monFirebaseConfig = { 
  apiKey: "AIzaSyCvX04dmE4OiMA4zGPHZI4bE9X00K6J_jc", 
  authDomain: "toogou-yaye-isseu-f8f91.firebaseapp.com", 
  projectId: "toogou-yaye-isseu-f8f91", 
  storageBucket: "toogou-yaye-isseu-f8f91.firebasestorage.app", 
  messagingSenderId: "124993461574", 
  appId: "1:124993461574:web:97adba4799483dd94b5947" 
};

const app = initializeApp(isCanvasEnv ? JSON.parse((window as any).__firebase_config) : monFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'toggou-app';
const getCol = (name: string) => isCanvasEnv ? collection(db, 'artifacts', appId, 'public', 'data', name) : collection(db, name);

// INJECTION PDF ET TAILWIND
if (typeof document !== 'undefined') {
  if (!document.getElementById('tailwind-cdn')) {
    const s = document.createElement('script'); s.id = 'tailwind-cdn'; s.src = 'https://cdn.tailwindcss.com'; document.head.appendChild(s);
  }
  if (!document.getElementById('jspdf-cdn')) {
    const s = document.createElement('script'); s.id = 'jspdf-cdn'; s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.head.appendChild(s);
  }
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('home');
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const logoClicks = useRef(0);
  const handleLogoTrigger = () => {
    logoClicks.current += 1;
    if (logoClicks.current >= 5) { logoClicks.current = 0; setShowLogin(true); }
    setTimeout(() => { logoClicks.current = 0; }, 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    const init = async () => {
      try {
        if ((window as any).__initial_auth_token) await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error(e); }
    };
    init();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(getCol('products'), (s) => {
          const p = s.docs.map(d=>({id:d.id, ...d.data()}));
          setProducts(p.length > 0 ? p : [{ id:'1', name:"Le Nokoss Royal", price:7500, description:"Assaisonnement 100% naturel fait maison.", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" }]);
          setLoading(false);
        });
        onSnapshot(getCol('orders'), (s) => setOrders(s.docs.map(d=>({id:d.id, ...d.data()})).sort((a:any,b:any)=>b.createdAt-a.createdAt)));
      }
    });
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const addToCart = (p: any) => { setCart([...cart, p]); setView('cart'); };

  const valider = async (info: any, method: string) => {
    const total = cart.reduce((s, i) => s + i.price, 0);
    const newOrder = { id: Date.now().toString(), customer: info, items: cart, total: total, method: method, status: 'Validée', createdAt: Date.now(), displayId: `TI-${Math.floor(Math.random()*90000)+10000}` };
    if (user) await setDoc(doc(getCol('orders'), newOrder.id), newOrder);
    setLastOrder(newOrder); setCart([]); setView('success');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFCF0] font-black text-green-800 animate-pulse uppercase">Ouverture...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-gray-800">
      
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl">
            <ShieldCheck size={40} className="mx-auto text-yellow-600 mb-4" />
            <h2 className="text-2xl font-black uppercase mb-6">Espace Chef</h2>
            <button onClick={() => {setIsAdmin(true); setShowLogin(false)}} className="w-full bg-black text-white py-4 rounded-2xl font-black">ENTRER</button>
          </div>
        </div>
      )}

      <header className="bg-[#006837] text-white p-3 sticky top-0 z-50 flex justify-between items-center border-b-4 border-yellow-400 shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoTrigger}>
          <img src={monLogo} className="w-10 h-10 bg-white rounded-full border-2 border-yellow-400" alt="logo" />
          <h1 className="font-black text-lg text-yellow-400 uppercase tracking-tighter">Toggou Yaye Isseu</h1>
        </div>
        <button onClick={() => setView('cart')} className="relative p-2 bg-black/20 rounded-full">
          <ShoppingCart size={22} />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-[#006837]">{cart.length}</span>}
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 py-8">
        {!isAdmin ? (
          <>
            {view === 'home' && (
              <div className="grid gap-8">
                {products.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col md:flex-row border border-green-50 animate-fade-in">
                    <div className="md:w-1/3 h-64 md:h-auto"><img src={p.image} className="w-full h-full object-cover" alt="pdt" /></div>
                    <div className="p-8 md:w-2/3">
                      <h2 className="text-3xl font-black text-green-800 uppercase tracking-tighter mb-4">{p.name}</h2>
                      <p className="text-gray-500 italic mb-8">"{p.description}"</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-4xl font-black text-green-700">{Number(p.price).toLocaleString()} F</span>
                        <button onClick={() => addToCart(p)} className="bg-[#006837] text-white px-10 py-4 rounded-2xl font-black uppercase shadow-lg transform active:scale-95 transition">Acheter</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'cart' && (
               <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl animate-fade-in">
                 <h2 className="text-2xl font-black mb-8 border-b pb-4 text-center uppercase">Panier</h2>
                 {cart.length === 0 ? <p className="text-center py-10 font-bold text-gray-300">Vide...</p> : cart.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center mb-4 font-bold border-b border-gray-50 pb-2 uppercase text-sm">
                     <span>{item.name}</span>
                     <span>{item.price.toLocaleString()} F</span>
                   </div>
                 ))}
                 {cart.length > 0 && (
                   <div className="mt-8 flex flex-col gap-4">
                      <p className="text-4xl font-black text-center text-green-900 mb-6">{cart.reduce((a,b)=>a+b.price,0).toLocaleString()} F</p>
                      <button onClick={() => valider({n:'Client Web', a:'Sénégal'}, 'Wave')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-lg flex items-center justify-center gap-2"><Smartphone size={20}/> Wave</button>
                      <button onClick={() => valider({n:'Client Web', a:'Sénégal'}, 'Livraison')} className="w-full bg-green-900 text-white py-5 rounded-2xl font-black uppercase shadow-lg flex items-center justify-center gap-2"><Truck size={20}/> Espèces</button>
                      <button onClick={() => setView('home')} className="text-gray-400 font-bold uppercase text-xs text-center mt-2 underline">Retour</button>
                   </div>
                 )}
               </div>
            )}

            {view === 'success' && (
              <div className="max-w-xl mx-auto bg-white p-12 rounded-[50px] shadow-2xl text-center animate-fade-in border-b-[16px] border-green-800">
                 <CheckCircle size={80} className="text-green-600 mx-auto mb-6" />
                 <h2 className="text-4xl font-black text-green-950 uppercase mb-4 leading-none tracking-tighter">MERCI !</h2>
                 <p className="text-gray-400 font-black mb-10 uppercase text-xs">Réf : {lastOrder?.displayId}</p>
                 <button onClick={() => {
                   const { jsPDF } = (window as any).jspdf;
                   const doc = new jsPDF();
                   const fN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                   doc.setFillColor(0, 104, 55); doc.rect(0, 0, 210, 40, 'F');
                   doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("TOGGOU YAYE ISSEU", 20, 25);
                   doc.setTextColor(0,0,0); doc.setFontSize(16); doc.text("FACTURE DE COMMANDE", 20, 60);
                   doc.setFontSize(10); doc.text("Reference: " + lastOrder.displayId, 20, 70);
                   doc.text("Paiement: " + lastOrder.method, 20, 76);
                   doc.line(20, 85, 190, 85);
                   let y = 95;
                   lastOrder.items.forEach((it:any) => { doc.text(String(it.name).toUpperCase(), 20, y); doc.text(fN(it.price) + " F", 160, y); y+=10; });
                   doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("TOTAL : " + fN(lastOrder.total) + " FCFA", 120, y + 15);
                   doc.save("Facture_Toggou.pdf");
                 }} className="bg-blue-600 text-white px-10 py-5 rounded-[25px] font-black uppercase text-sm mb-4 flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition"><Download size={20}/> Télécharger le Reçu PDF</button>
                 <br/><button onClick={() => setView('home')} className="text-green-800 font-black uppercase text-sm mt-8 underline">Fermer</button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl animate-fade-in border-t-[12px] border-green-800">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Commandes Reçues</h2>
               <button onClick={() => setIsAdmin(false)} className="bg-red-500 text-white p-2 px-4 rounded-xl font-bold text-xs uppercase">X</button>
             </div>
             <div className="space-y-4">
                {orders.length === 0 ? <p className="text-center py-20 text-gray-300 font-bold italic">En attente...</p> : orders.map((o:any)=>(
                   <div key={o.id} className="bg-gray-50 p-6 rounded-[30px] flex justify-between items-center border-l-8 border-green-600 shadow-sm">
                      <div>
                        <p className="font-black text-xl uppercase tracking-tighter">{o.customer?.n || "Client"}</p>
                        <p className="text-[10px] font-black text-gray-400">Paiement : {o.method}</p>
                      </div>
                      <p className="text-2xl font-black text-green-800 tracking-tighter">{o.total.toLocaleString()} F</p>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <footer className="p-10 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest mt-auto border-t border-gray-100">
        © {new Date().getFullYear()} Mouhamed • Excellence Culinaire 🇸🇳
      </footer>
    </div>
  );
}