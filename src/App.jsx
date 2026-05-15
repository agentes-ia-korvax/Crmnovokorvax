import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── WHITE LABEL PADRÃO ──────────────────────────────────────────────────────
const BRAND_DEFAULT = {
  nome:        "Gestify",
  inicial:     "G",
  subtitulo:   "CRM - Controle de Clientes",
  tagCRM:      "CRM IA",
  corPrimaria: "#8b5cf6",
};

// ─── FUNÇÕES DE CONFIG NO SUPABASE ───────────────────────────────────────────
async function loadBrandConfig(supabaseUrl, supabaseKey) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes?id=eq.brand&select=valor`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.valor || null;
  } catch { return null; }
}

async function saveBrandConfig(supabaseUrl, supabaseKey, brand) {
  const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes`, {
    method: "POST",
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ id: "brand", valor: brand }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadUsuarios(supabaseUrl, supabaseKey) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes?id=eq.usuarios&select=valor`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.valor || null;
  } catch { return null; }
}

async function saveUsuarios(supabaseUrl, supabaseKey, usuarios) {
  const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes`, {
    method: "POST",
    headers: {
      "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ id: "usuarios", valor: usuarios }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadPlano(supabaseUrl, supabaseKey) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes?id=eq.plano&select=valor`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.valor || null;
  } catch { return null; }
}

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://myytrzwiefytbeubaalz.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eXRyendpZWZ5dGJldWJhYWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mzk4ODIsImV4cCI6MjA5MjExNTg4Mn0.Qk_yedbiDNnoGi5xi4bRM-_Yvx-2ce2YOzjf1Qcvr7k";
const EVO_URL = process.env.REACT_APP_EVO_URL || "https://korvax-apps-evolution-api.obeisx.easypanel.host";
const EVO_KEY = process.env.REACT_APP_EVO_KEY || "A22EACBD08B1-4AAC-A51D-57976BE67F73";
const EVO_INST = process.env.REACT_APP_EVO_INST || "crm";

// ─── SUPABASE HELPER ──────────────────────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getClients() { return sbFetch("dados_cliente?select=*&order=created_at.desc"); }
async function getCobracas() { return sbFetch("cobrancas?select=*&order=data_vencimento.asc"); }

async function getChatHistory(telefone) {
  const data = await sbFetch(`n8n_chat_histories?session_id=eq.${encodeURIComponent(telefone)}&order=id.asc&limit=100`);
  const messages = (data || []).map(row => {
    try {
      const msg = typeof row.message === "string" ? JSON.parse(row.message) : row.message;
      return {
        id: row.id,
        type: msg.type === "human" ? "human" : "ai",
        content: msg.content || "",
        sender: msg.additional_kwargs?.sender || null,
        hora: new Date(row.created_at || Date.now()).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }),
      };
    } catch { return null; }
  }).filter(Boolean);
  
  const uniqueMessages = messages.filter((msg, index, self) =>
    index === self.findIndex((m) => m.id === msg.id)
  );
  
  return uniqueMessages;
}

async function updateClientIA(telefone, status) {
  return sbFetch(`dados_cliente?telefone=eq.${encodeURIComponent(telefone)}`, {
    method: "PATCH", body: JSON.stringify({ atendimento_ia: status }),
  });
}

async function updateClientServico(telefone, servico) {
  return sbFetch(`dados_cliente?telefone=eq.${encodeURIComponent(telefone)}`, {
    method: "PATCH", body: JSON.stringify({ tipo_servico: servico }),
  });
}

async function sendEvoMessage(telefone, texto) {
  const number = telefone.replace("@s.whatsapp.net", "");
  const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INST}`, {
    method: "POST",
    headers: { "apikey": EVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ number, text: texto, delay: 1200 }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── TIPOS DE SERVIÇO ─────────────────────────────────────────────────────────
const TIPO_SERVICO_COLOR = {
  SITE: "#3b82f6",
  SOCIAL_MEDIA: "#ec4899",
  GESTAO_MIDIAS: "#f59e0b",
  IDENTIDADE_VISUAL: "#10b981",
  CONSULTORIA: "#8b5cf6",
  OUTRO: "#4b5563",
};

const TIPO_SERVICO_LABEL = {
  SITE: "Site",
  SOCIAL_MEDIA: "Social Media",
  GESTAO_MIDIAS: "Gestão de Mídias",
  IDENTIDADE_VISUAL: "Identidade Visual",
  CONSULTORIA: "Consultoria",
  OUTRO: "Outro",
};

// ─── NICHOS ───────────────────────────────────────────────────────────────────
const NICHOS = [
  "E-commerce",
  "Consultórios",
  "Restaurantes",
  "Imobiliária",
  "Advocacia",
  "Educação",
  "Saúde",
  "Beleza",
  "Tecnologia",
  "Varejo",
  "Serviços",
  "Outro"
];

const NICHO_COLORS = {
  "E-commerce": "#ff6b6b",
  "Consultórios": "#4ecdc4",
  "Restaurantes": "#ffe66d",
  "Imobiliária": "#95e1d3",
  "Advocacia": "#a8d8ea",
  "Educação": "#aa96da",
  "Saúde": "#fcbad3",
  "Beleza": "#f8b500",
  "Tecnologia": "#667bc6",
  "Varejo": "#da70d6",
  "Serviços": "#ffa502",
  "Outro": "#6b7280",
};

const AV_COLORS = ["#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#6366f1"];

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────
function fmtPhone(t = "") {
  const n = t.replace("@s.whatsapp.net", "");
  if (n.length < 12) return n;
  return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
}

function fmtCurrency(v) {
  if (!v && v !== 0) return "—";
  return Number(v).toLocaleString("pt-BR", { style:"currency", currency:"BRL", maximumFractionDigits:0 });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function diasAteVencimento(dataVencimento) {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = vencimento - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function buildGrowthData(clients) {
  const map = {};
  clients.forEach(c => {
    const d = new Date(c.created_at);
    const key = d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).slice(-7).map(([dia, clientes]) => ({ dia, clientes }));
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 36 }) {
  const idx = (name || "?").charCodeAt(0) % AV_COLORS.length;
  const initials = (name || "?").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg, ${AV_COLORS[idx]}cc, ${AV_COLORS[(idx+2)%AV_COLORS.length]}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.35, color:"#fff", flexShrink:0, border:`1.5px solid ${AV_COLORS[idx]}44`, boxShadow:`0 0 12px ${AV_COLORS[idx]}22` }}>
      {initials}
    </div>
  );
}

function Badge({ servico = "", onClick }) {
  const c = TIPO_SERVICO_COLOR[servico] || "#4b5563";
  return (
    <span onClick={onClick} style={{ background:`${c}15`, color:c, border:`1px solid ${c}35`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", cursor:onClick?"pointer":"default", whiteSpace:"nowrap", transition:"all .15s" }}>
      {TIPO_SERVICO_LABEL[servico] || "Sem serviço"}
    </span>
  );
}

function StatusDot({ active, brand = BRAND_DEFAULT }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:active?brand.corPrimaria:"#f59e0b", fontWeight:600 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:active?brand.corPrimaria:"#f59e0b", boxShadow:`0 0 6px ${active?brand.corPrimaria:"#f59e0b"}` }} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, []);
  const colors = { ok:"#10b981", warn:"#f59e0b", info:"#3b82f6", err:"#ef4444" };
  return (
    <div style={{ background:"#0d1117", color:"#e6edf3", padding:"12px 18px", borderRadius:10, fontWeight:500, fontSize:13, boxShadow:`0 8px 32px rgba(0,0,0,.6), inset 0 1px 0 ${colors[type]}30`, display:"flex", alignItems:"center", gap:10, animation:"toastIn .25s ease", border:`1px solid ${colors[type]}30` }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:colors[type], boxShadow:`0 0 8px ${colors[type]}`, flexShrink:0 }} />
      {msg}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:15, height:15, border:"2px solid #ffffff20", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />;
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Ic = ({ d, size=16, stroke=1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const IcRect = ({ rects, size=16, stroke=1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    {rects}
  </svg>
);

const ICONS = {
  overview: <IcRect size={15} stroke={1.6} rects={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />,
  clientes: <Ic size={15} stroke={1.6} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  conversas: <Ic size={15} stroke={1.6} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  cobrancas: <Ic size={15} stroke={1.6} d={["M12 2v20m8-10H4","M20 10l2 2m-14 6l-2-2M7 10l-2 2m14 6l2-2"]} />,
  agenda:   <IcRect size={15} stroke={1.6} rects={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  refresh:  <Ic size={15} stroke={1.6} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
  sun:      <Ic size={15} stroke={1.6} d={["M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42","M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"]} />,
  moon:     <Ic size={15} stroke={1.6} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  logout:   <Ic size={15} stroke={1.6} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />,
  chevLeft: <Ic size={15} stroke={1.6} d="M15 18l-6-6 6-6" />,
  chevRight:<Ic size={15} stroke={1.6} d="M9 18l6-6-6-6" />,
  aparencia:<Ic size={15} stroke={1.6} d={["M12 20h9","M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"]} />,
};

function FieldCard({ label, value, color, icon, textC, mutedC, borderC, cardBg }) {
  if (!value && value !== false) return null;
  const accent = color || "#6b7280";
  return (
    <div style={{
      background: color ? `${color}12` : cardBg,
      border: `1.5px solid ${color ? color+"35" : borderC}`,
      borderRadius: 14,
      padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
      boxShadow: color ? `0 2px 12px ${color}18` : "none",
    }}>
      {color && <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg,${color},${color}55)`, borderRadius:"14px 0 0 14px" }} />}
      <div style={{ paddingLeft: color ? 6 : 0 }}>
        <div style={{ fontSize:9, color: accent, fontWeight:800, textTransform:"uppercase", letterSpacing:1.2, display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
          {icon && <span style={{ fontSize:11 }}>{icon}</span>}
          {label}
        </div>
        <div style={{ fontSize:13, color: color ? accent : textC, fontWeight:600, lineHeight:1.4, wordBreak:"break-word" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, total, cardBg, borderC, mutedC, subC }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}cc, ${color}22)`, borderRadius:"12px 12px 0 0" }} />
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:10, color:mutedC, fontWeight:600, textTransform:"uppercase", letterSpacing:.8 }}>{label}</span>
        <span style={{ color:mutedC }}>{icon}</span>
      </div>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:26, fontWeight:800, color, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>{value}</div>
      <div style={{ marginTop:10, height:2, background:borderC, borderRadius:10 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${color}, ${color}88)`, borderRadius:10, transition:"width .8s ease" }} />
      </div>
      <div style={{ fontSize:10, color:subC, marginTop:4 }}>{pct}% do total</div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, brand, usuarios }) {
  const [user, setUser] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const lista = usuarios && usuarios.length > 0 ? usuarios : [{ username:"admin", password:"admin123", nome:"Admin", role:"admin" }];
    const found = lista.find(u => u.username === user.trim() && u.password === pass);
    if (found) onLogin(found);
    else { setErr("Usuário ou senha incorretos"); setLoading(false); }
  };
  return (
    <div style={{ height:"100vh", background:"#05070a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 80% 60% at 50% -10%, ${brand.corPrimaria}08 0%, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:16, padding:"40px 40px", width:380, position:"relative", boxShadow:"0 32px 80px rgba(0,0,0,.6)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontWeight:800, fontSize:32, color:"#e6edf3", letterSpacing:-.5, marginBottom:8 }}>{brand.nome}</div>
          <div style={{ fontSize:12, color:"#7d8590", marginTop:4 }}>{brand.subtitulo}</div>
        </div>
        {[{label:"Usuário",val:user,set:setUser,type:"text",ph:"admin"},{label:"Senha",val:pass,set:setPass,type:"password",ph:"••••••••"}].map(f=>(
          <div key={f.label} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#7d8590", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>{f.label}</label>
            <input value={f.val} onChange={e=>{f.set(e.target.value);setErr("");}} type={f.type} placeholder={f.ph} onKeyDown={e=>e.key==="Enter"&&handle()}
              style={{ width:"100%", background:"#161b22", border:"1px solid #30363d", borderRadius:8, padding:"11px 14px", color:"#e6edf3", fontFamily:"'Inter',sans-serif", fontSize:14, outline:"none", transition:"border .2s", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=brand.corPrimaria} onBlur={e=>e.target.style.borderColor="#30363d"} />
          </div>
        ))}
        {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12, textAlign:"center", padding:"8px", background:"#ef444410", borderRadius:6, border:"1px solid #ef444430" }}>{err}</div>}
        <button onClick={handle} disabled={loading} style={{ width:"100%", background:`linear-gradient(135deg,${brand.corPrimaria},${brand.corPrimaria}cc)`, color:"#fff", border:"none", borderRadius:8, padding:"12px", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.7:1, letterSpacing:.3 }}>
          {loading ? <><Spinner /> Entrando...</> : "Entrar"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn]   = useState(() => localStorage.getItem("fd_auth") === "1");
  const [dark, setDark] = useState(() => localStorage.getItem("fd_dark") !== "0");
  const [tab, setTab]             = useState("overview");
  const [clients, setClients]     = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");
  const [filterServico, setFilterServico] = useState("TODOS");
  const [filterNicho, setFilterNicho] = useState("TODOS");
  const [toasts, setToasts]       = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [msgInput, setMsgInput]   = useState("");
  const [sending, setSending]     = useState(false);
  const [evoStatus, setEvoStatus] = useState("checking");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  // White label
  const [brand, setBrand]         = useState(BRAND_DEFAULT);
  const [brandDraft, setBrandDraft] = useState(BRAND_DEFAULT);
  const [brandLoading, setBrandLoading] = useState(false);

  // Usuários & Plano
  const [loggedUser, setLoggedUser] = useState(() => { try { return JSON.parse(localStorage.getItem("fd_user")||"null"); } catch { return null; } });
  const [usuarios, setUsuarios]   = useState([]);
  const [plano, setPlano]         = useState({ maxUsuarios: 2, nome:"Starter", vencimento:null, status:"ativo", preco:0, contatoVendas:"" });
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNome, setNewNome]     = useState("");
  const [usuariosSubTab, setUsuariosSubTab] = useState("usuarios");

  // Modal de Nova Cobrança
  const [novaCobrancaModal, setNovaCobrancaModal] = useState(false);
  const [novaCobranca, setNovaCobranca] = useState({ cliente_id: "", descricao: "", valor: "", data_vencimento: "", tipo_recorrencia: "mensal", status: "ativa", webhook_url: "" });

  useEffect(() => {
    loadBrandConfig(SUPABASE_URL, SUPABASE_KEY).then(val => {
      if (val) { setBrand({ ...BRAND_DEFAULT, ...val }); setBrandDraft({ ...BRAND_DEFAULT, ...val }); }
    });
    loadUsuarios(SUPABASE_URL, SUPABASE_KEY).then(val => { if (val) setUsuarios(val); });
    loadPlano(SUPABASE_URL, SUPABASE_KEY).then(val => { if (val) setPlano({ maxUsuarios:2, nome:"Starter", vencimento:null, status:"ativo", preco:0, contatoVendas:"", ...val }); });
  }, []);

  async function handleSaveBrand() {
    setBrandLoading(true);
    try {
      await saveBrandConfig(SUPABASE_URL, SUPABASE_KEY, brandDraft);
      setBrand(brandDraft);
      toast("Aparência salva! Todos os usuários verão as mudanças.", "ok");
    } catch(e) {
      toast("Erro ao salvar: " + e.message, "err");
    } finally { setBrandLoading(false); }
  }

  function handleResetBrand() {
    setBrandDraft(BRAND_DEFAULT);
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatHistory]);

  useEffect(() => {
    if (!selected) return;
    setChatHistory([]);
    setLoadingChat(true);
    getChatHistory(selected.telefone)
      .then(h => setChatHistory(h))
      .catch(() => {})
      .finally(() => setLoadingChat(false));
  }, [selected?.telefone]);

  async function loadClients() {
    setLoading(true);
    try {
      const [clientData, cobData] = await Promise.all([getClients(), getCobracas().catch(()=>[])]);
      setClients(clientData || []);
      setCobrancas(cobData || []);
    } catch(e) { toast("Erro ao carregar dados: " + e.message, "err"); }
    finally { setLoading(false); }
  }

  async function checkEvolution() {
    try {
      const res = await fetch(`${EVO_URL}/instance/fetchInstances`, { headers: { "apikey": EVO_KEY } });
      setEvoStatus(res.ok ? "ok" : "err");
    } catch { setEvoStatus("err"); }
  }

  useEffect(() => { if (loggedIn) { loadClients(); checkEvolution(); } }, [loggedIn]);
  useEffect(() => { if (!loggedIn) return; const t = setInterval(loadClients, 30000); return () => clearInterval(t); }, [loggedIn]);

  function toast(msg, type="ok") {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3200);
  }

  async function toggleIA(client, e) {
    e?.stopPropagation();
    const next = client.atendimento_ia === "pause" ? "ativo" : "pause";
    setClients(prev => prev.map(c => c.id===client.id ? {...c, atendimento_ia:next} : c));
    if (selected?.id===client.id) setSelected(s=>({...s, atendimento_ia:next}));
    try {
      await updateClientIA(client.telefone, next);
      toast(next==="pause" ? `Cliente pausado — ${client.nomewpp}` : `Cliente ativo — ${client.nomewpp}`, next==="pause"?"warn":"ok");
    } catch(e) {
      setClients(prev => prev.map(c => c.id===client.id ? {...c, atendimento_ia:client.atendimento_ia} : c));
      toast("Erro ao atualizar: " + e.message, "err");
    }
  }

  async function changeServico(id, servico) {
    const client = clients.find(c=>c.id===id);
    setClients(prev=>prev.map(c=>c.id===id?{...c,tipo_servico:servico}:c));
    if (selected?.id===id) setSelected(s=>({...s,tipo_servico:servico}));
    try {
      await updateClientServico(client.telefone, servico);
      toast(`Serviço → ${TIPO_SERVICO_LABEL[servico]||"Sem serviço"}`, "info");
    } catch(e) {
      setClients(prev=>prev.map(c=>c.id===id?{...c,tipo_servico:client.tipo_servico}:c));
      toast("Erro: " + e.message, "err");
    }
  }

  async function sendMessage() {
    if (!msgInput.trim() || !selected || sending) return;
    setSending(true);
    const texto = msgInput;
    try {
      await sendEvoMessage(selected.telefone, texto);
      toast("Mensagem enviada!", "ok");
      setMsgInput("");
    } catch(e) { toast("Erro ao enviar: " + e.message, "err"); }
    finally { setSending(false); }
  }

  async function criarCobranca() {
    if (!novaCobranca.cliente_id || !novaCobranca.valor || !novaCobranca.data_vencimento) {
      toast("Preencha todos os campos", "err");
      return;
    }
    try {
      await sbFetch("cobrancas", {
        method: "POST",
        body: JSON.stringify({ ...novaCobranca, id: Date.now() })
      });
      // Dispara webhook se configurado
      if (novaCobranca.webhook_url) {
        fetch(novaCobranca.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "cobranca_criada", cobranca: novaCobranca, data: new Date().toISOString() })
        }).catch(() => {});
      }
      toast("Cobrança criada!", "ok");
      setNovaCobranca({ cliente_id: "", descricao: "", valor: "", data_vencimento: "", tipo_recorrencia: "mensal", status: "ativa", webhook_url: "" });
      setNovaCobrancaModal(false);
      loadClients();
    } catch(e) {
      toast("Erro ao criar cobrança: " + e.message, "err");
    }
  }

  const total = clients.length;
  const ativos = clients.filter(c => c.atendimento_ia !== "pause").length;
  const pausados = clients.filter(c => c.atendimento_ia === "pause").length;

  const hoje = new Date().toLocaleDateString("pt-BR");
  const cobrancasVencendo = cobrancas.filter(c => {
    const dias = diasAteVencimento(c.data_vencimento);
    return dias <= 7 && dias > 0 && c.status === "ativa";
  });
  const cobrancasVencidas = cobrancas.filter(c => {
    const dias = diasAteVencimento(c.data_vencimento);
    return dias < 0 && c.status === "ativa";
  });

  const filtered = clients.filter(c => {
    const s = search.toLowerCase();
    return (c.nomewpp?.toLowerCase().includes(s) || c.telefone?.includes(s)) &&
           (filterServico==="TODOS" || c.tipo_servico===filterServico) &&
           (filterNicho==="TODOS" || c.nicho===filterNicho);
  });

  function exportCSV() {
    const cols = ["nomewpp","telefone","tipo_servico","nicho","atendimento_ia","created_at"];
    const header = cols.join(";");
    const rows = filtered.map(c => cols.map(k => {
      const v = c[k] ?? "";
      return `"${String(v).replace(/"/g,'""')}"`;
    }).join(";"));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="clientes_crm.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exportado!", "ok");
  }

  const growthData = buildGrowthData(clients);
  const pieData = Object.entries(TIPO_SERVICO_LABEL).filter(([k])=>k!=="OUTRO").map(([key, label]) => ({
    name: label,
    value: clients.filter(c=>c.tipo_servico===key).length,
    color: TIPO_SERVICO_COLOR[key] || "#4b5563",
  })).filter(d=>d.value>0);

  const isAdmin = !loggedUser || loggedUser.role === "admin";

  const NAV = [
    {id:"overview", icon:ICONS.overview, label:"Visão Geral"},
    {id:"clientes", icon:ICONS.clientes, label:"Clientes"},
    {id:"cobrancas", icon:ICONS.cobrancas, label:"Cobranças"},
    {id:"conversas",icon:ICONS.conversas,label:"Conversas"},
    {id:"agenda",     icon:ICONS.agenda,    label:"Agenda"},
    ...(isAdmin ? [
      {id:"usuarios",   icon:<Ic size={15} stroke={1.6} d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75","M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"]} />, label:"Usuários"},
      {id:"aparencia",  icon:ICONS.aparencia, label:"Aparência"},
    ] : []),
  ];

  if (!loggedIn) return <Login onLogin={(user)=>{ localStorage.setItem("fd_auth","1"); localStorage.setItem("fd_user", JSON.stringify(user)); setLoggedIn(true); setLoggedUser(user); }} brand={brand} usuarios={usuarios} />;

  const bg      = dark ? "#05070a" : "#f4f6f8";
  const cardBg  = dark ? "#0d1117" : "#ffffff";
  const borderC = dark ? "#21262d" : "#e2e8f0";
  const textC   = dark ? "#e6edf3" : "#0f172a";
  const mutedC  = dark ? "#7d8590" : "#64748b";
  const subC    = dark ? "#4b5563" : "#94a3b8";
  const inputBg = dark ? "#161b22" : "#f8fafc";
  const rowHov  = dark ? "#161b2250" : "#f1f5f960";

  return (
    <div style={{ display:"flex", height:"100vh", background:bg, color:textC, fontFamily:"'Inter',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,800&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${borderC};border-radius:10px;}
        .hrow:hover{background:${rowHov} !important;}
        @keyframes toastIn{0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?240:70, background:cardBg, borderRight:`1px solid ${borderC}`, display:"flex", flexDirection:"column", transition:"width .3s", overflow:"hidden" }}>
        <div style={{ padding:"20px 16px", borderBottom:`1px solid ${borderC}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {sidebarOpen && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:800, fontSize:14 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${brand.corPrimaria},${brand.corPrimaria}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:800 }}>
                {brand.inicial}
              </div>
              <span>{brand.nome}</span>
            </div>
          )}
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", cursor:"pointer", color:mutedC, padding:4 }}>
            {ICONS.chevRight}
          </button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {NAV.map(nav => (
            <button
              key={nav.id}
              onClick={() => setTab(nav.id)}
              style={{
                width:"100%",
                background: tab===nav.id ? `${brand.corPrimaria}20` : "transparent",
                border: tab===nav.id ? `1px solid ${brand.corPrimaria}40` : "1px solid transparent",
                color: tab===nav.id ? brand.corPrimaria : mutedC,
                borderRadius:10,
                padding:"10px 12px",
                marginBottom:6,
                display:"flex",
                alignItems:"center",
                gap:12,
                cursor:"pointer",
                fontSize:13,
                fontWeight:600,
                transition:"all .15s"
              }}
            >
              {nav.icon}
              {sidebarOpen && <span>{nav.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding:"12px", borderTop:`1px solid ${borderC}`, display:"flex", gap:8 }}>
          <button onClick={()=>setDark(!dark)} style={{ flex:1, background:"none", border:`1px solid ${borderC}`, borderRadius:8, color:mutedC, padding:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {dark ? ICONS.sun : ICONS.moon}
          </button>
          <button onClick={()=>{ localStorage.removeItem("fd_auth"); localStorage.removeItem("fd_user"); setLoggedIn(false); }} style={{ flex:1, background:"none", border:`1px solid ${borderC}`, borderRadius:8, color:mutedC, padding:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {ICONS.logout}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* HEADER */}
        <div style={{ background:cardBg, borderBottom:`1px solid ${borderC}`, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h1 style={{ fontSize:18, fontWeight:700 }}>
            {NAV.find(n=>n.id===tab)?.label || "Dashboard"}
          </h1>
          <button onClick={loadClients} style={{ background:`${brand.corPrimaria}20`, border:`1px solid ${brand.corPrimaria}30`, color:brand.corPrimaria, borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            {ICONS.refresh} Atualizar
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
          {loading && <div style={{ textAlign:"center", padding:40 }}><Spinner /></div>}

          {!loading && tab === "overview" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16, marginBottom:20 }}>
                <StatCard label="Total de Clientes" value={total} color={brand.corPrimaria} total={total} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC} />
                <StatCard label="Clientes Ativos" value={ativos} color="#10b981" total={total} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC} />
                <StatCard label="Inativos" value={pausados} color="#f59e0b" total={total} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC} />
                <StatCard label="Cobrança Vencendo" value={cobrancasVencendo.length} color="#ef4444" total={cobrancas.length || 1} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC} />
              </div>

              {cobrancasVencidas.length > 0 && (
                <div style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:12, padding:16, marginBottom:20 }}>
                  <div style={{ color:"#ef4444", fontWeight:700, marginBottom:8 }}>⚠️ {cobrancasVencidas.length} cobrança(s) vencida(s)</div>
                  <div style={{ fontSize:12, color:mutedC }}>{cobrancasVencidas.map(c => c.descricao).join(", ")}</div>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginTop:20 }}>
                <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Crescimento de Clientes (últimos 7 dias)</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={growthData}>
                      <CartesianGrid stroke={borderC} />
                      <XAxis dataKey="dia" stroke={mutedC} style={{fontSize:12}} />
                      <YAxis stroke={mutedC} style={{fontSize:12}} />
                      <Tooltip contentStyle={{background:cardBg, border:`1px solid ${borderC}`, borderRadius:8}} />
                      <Line type="monotone" dataKey="clientes" stroke={brand.corPrimaria} strokeWidth={2} dot={{fill:brand.corPrimaria}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Serviços em Demanda</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({name, percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:cardBg, border:`1px solid ${borderC}`, borderRadius:8}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === "clientes" && (
            <div>
              <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                <input
                  placeholder="Buscar por nome ou telefone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex:1, background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }}
                />
                <select value={filterServico} onChange={e => setFilterServico(e.target.value)} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }}>
                  <option value="TODOS">Todos os Serviços</option>
                  {Object.entries(TIPO_SERVICO_LABEL).filter(([k])=>k!=="OUTRO").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterNicho} onChange={e => setFilterNicho(e.target.value)} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }}>
                  <option value="TODOS">Todos os Nichos</option>
                  {NICHOS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={exportCSV} style={{ background:`${brand.corPrimaria}20`, border:`1px solid ${brand.corPrimaria}30`, color:brand.corPrimaria, borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  Exportar
                </button>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40, color:mutedC }}>Nenhum cliente encontrado</div>
                ) : (
                  filtered.map(client => (
                    <div
                      key={client.id}
                      onClick={() => setSelected(client)}
                      className="hrow"
                      style={{ background: selected?.id===client.id ? `${brand.corPrimaria}20` : cardBg, border: selected?.id===client.id ? `1px solid ${brand.corPrimaria}40` : `1px solid ${borderC}`, borderRadius:10, padding:12, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"space-between" }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
                        <Avatar name={client.nomewpp} size={40} />
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{client.nomewpp}</div>
                          <div style={{ fontSize:11, color:mutedC }}>{fmtPhone(client.telefone)}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:11, textAlign:"right" }}>
                          <div style={{ color:NICHO_COLORS[client.nicho] || mutedC, fontWeight:600 }}>{client.nicho || "—"}</div>
                        </div>
                        <Badge servico={client.tipo_servico} />
                        <button
                          onClick={(e) => toggleIA(client, e)}
                          style={{ background:`${client.atendimento_ia === "pause" ? "#f59e0b" : brand.corPrimaria}20`, border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600, color: client.atendimento_ia === "pause" ? "#f59e0b" : brand.corPrimaria }}
                        >
                          {client.atendimento_ia === "pause" ? "Inativo" : "Ativo"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!loading && tab === "cobrancas" && (
            <div>
              <button
                onClick={() => setNovaCobrancaModal(true)}
                style={{ background:brand.corPrimaria, color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", marginBottom:16, cursor:"pointer", fontWeight:600, fontSize:13 }}
              >
                + Nova Cobrança
              </button>

              {novaCobrancaModal && (
                <div style={{ background:`${cardBg}cc`, border:`1px solid ${borderC}`, borderRadius:12, padding:20, marginBottom:16 }}>
                  <h3 style={{ marginBottom:12 }}>Nova Cobrança</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <input placeholder="Descrição" value={novaCobranca.descricao} onChange={e => setNovaCobranca({...novaCobranca, descricao: e.target.value})} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                    <input placeholder="Valor" type="number" value={novaCobranca.valor} onChange={e => setNovaCobranca({...novaCobranca, valor: e.target.value})} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                    <input placeholder="Data de Vencimento" type="date" value={novaCobranca.data_vencimento} onChange={e => setNovaCobranca({...novaCobranca, data_vencimento: e.target.value})} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                    <select value={novaCobranca.tipo_recorrencia} onChange={e => setNovaCobranca({...novaCobranca, tipo_recorrencia: e.target.value})} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }}>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                      <option value="unica">Única</option>
                    </select>
                    <input placeholder="Webhook URL (opcional)" value={novaCobranca.webhook_url} onChange={e => setNovaCobranca({...novaCobranca, webhook_url: e.target.value})} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button onClick={criarCobranca} style={{ flex:1, background:brand.corPrimaria, color:"#fff", border:"none", borderRadius:8, padding:"10px", cursor:"pointer", fontWeight:600, fontSize:13 }}>Criar</button>
                    <button onClick={() => setNovaCobrancaModal(false)} style={{ flex:1, background:borderC, color:textC, border:"none", borderRadius:8, padding:"10px", cursor:"pointer", fontWeight:600, fontSize:13 }}>Cancelar</button>
                  </div>
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {cobrancas.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40, color:mutedC }}>Nenhuma cobrança registrada</div>
                ) : (
                  cobrancas.map(cob => {
                    const dias = diasAteVencimento(cob.data_vencimento);
                    const statusColor = dias < 0 ? "#ef4444" : dias <= 7 ? "#f59e0b" : "#10b981";
                    const cliente = clients.find(c => c.id === cob.cliente_id);
                    return (
                      <div key={cob.id} style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:10, padding:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{cob.descricao}</div>
                          <div style={{ fontSize:11, color:mutedC }}>{cliente?.nomewpp || "Cliente desconhecido"}</div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontWeight:700, fontSize:14 }}>{fmtCurrency(cob.valor)}</div>
                            <div style={{ fontSize:11, color:statusColor, fontWeight:600 }}>
                              {dias < 0 ? `${Math.abs(dias)} dias atrasado` : dias === 0 ? "Vence hoje" : `Vence em ${dias} dias`}
                            </div>
                          </div>
                          <div style={{ fontSize:11, background:`${statusColor}20`, color:statusColor, padding:"4px 8px", borderRadius:6, fontWeight:600 }}>
                            {cob.tipo_recorrencia}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {!loading && tab === "conversas" && selected && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 350px", gap:20, height:"100%" }}>
              <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16, display:"flex", flexDirection:"column" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Histórico de Conversa</div>
                <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                  {loadingChat ? <div style={{textAlign:"center", padding:20}}><Spinner /></div> : chatHistory.length === 0 ? (
                    <div style={{textAlign:"center", padding:20, color:mutedC, fontSize:12}}>Nenhuma mensagem</div>
                  ) : (
                    chatHistory.map(msg => (
                      <div key={msg.id} style={{ background: msg.type==="human" ? `${brand.corPrimaria}20` : borderC, borderRadius:8, padding:10, fontSize:12, alignSelf: msg.type==="human" ? "flex-end" : "flex-start", maxWidth:"80%" }}>
                        {msg.content}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && sendMessage()}
                    placeholder="Escrever mensagem..."
                    style={{ flex:1, background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:12, outline:"none" }}
                  />
                  <button onClick={sendMessage} disabled={sending} style={{ background:brand.corPrimaria, color:"#fff", border:"none", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontWeight:600, opacity:sending?0.7:1 }}>
                    {sending ? <Spinner /> : "Enviar"}
                  </button>
                </div>
              </div>

              <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16, display:"flex", flexDirection:"column" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Informações</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <FieldCard label="Nome" value={selected.nomewpp} color={brand.corPrimaria} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  <FieldCard label="Telefone" value={fmtPhone(selected.telefone)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  <FieldCard label="Serviço" value={TIPO_SERVICO_LABEL[selected.tipo_servico] || "—"} color={TIPO_SERVICO_COLOR[selected.tipo_servico]} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  <FieldCard label="Nicho" value={selected.nicho || "—"} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  <FieldCard label="Status" value={selected.atendimento_ia === "pause" ? "Inativo" : "Ativo"} color={selected.atendimento_ia === "pause" ? "#f59e0b" : "#10b981"} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  <FieldCard label="Cadastrado em" value={fmtDate(selected.created_at)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                </div>
              </div>
            </div>
          )}

          {!loading && tab === "conversas" && !selected && (
            <div style={{ textAlign:"center", padding:40, color:mutedC }}>Selecione um cliente para ver a conversa</div>
          )}

          {!loading && tab === "usuarios" && isAdmin && (
            <div style={{ maxWidth:600 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <button onClick={()=>setUsuariosSubTab("usuarios")} style={{ background:usuariosSubTab==="usuarios"?brand.corPrimaria:"transparent", color:usuariosSubTab==="usuarios"?"#fff":mutedC, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", cursor:"pointer", fontWeight:600, fontSize:12 }}>Usuários</button>
                <button onClick={()=>setUsuariosSubTab("plano")} style={{ background:usuariosSubTab==="plano"?brand.corPrimaria:"transparent", color:usuariosSubTab==="plano"?"#fff":mutedC, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", cursor:"pointer", fontWeight:600, fontSize:12 }}>Plano</button>
              </div>

              {usuariosSubTab==="usuarios" && (
                <div>
                  <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16, marginBottom:16 }}>
                    <h3 style={{ marginBottom:12 }}>Novo Usuário</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <input placeholder="Usuário" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                      <input placeholder="Senha" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                      <input placeholder="Nome" value={newNome} onChange={e => setNewNome(e.target.value)} style={{ background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none", gridColumn:"1 / -1" }} />
                    </div>
                    <button style={{ width:"100%", background:brand.corPrimaria, color:"#fff", border:"none", borderRadius:8, padding:"10px", marginTop:12, cursor:"pointer", fontWeight:600, fontSize:13 }}>Adicionar</button>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {usuarios.map(u => (
                      <div key={u.username} style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:10, padding:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.nome}</div>
                          <div style={{ fontSize:11, color:mutedC }}>@{u.username}</div>
                        </div>
                        <button style={{ background:"#ef444420", color:"#ef4444", border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>Remover</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usuariosSubTab==="plano" && (
                <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <FieldCard label="Plano" value={plano.nome} color={brand.corPrimaria} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                    <FieldCard label="Status" value={plano.status} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                    <FieldCard label="Valor" value={fmtCurrency(plano.preco)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                    <FieldCard label="Vencimento" value={fmtDate(plano.vencimento)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg} />
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && tab === "aparencia" && isAdmin && (
            <div style={{ maxWidth:600 }}>
              <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:12, padding:16 }}>
                <h3 style={{ marginBottom:16 }}>White Label - Aparência</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:mutedC, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>Nome</label>
                    <input value={brandDraft.nome} onChange={e => setBrandDraft({...brandDraft, nome: e.target.value})} style={{ width:"100%", background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:mutedC, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>Inicial</label>
                    <input value={brandDraft.inicial} onChange={e => setBrandDraft({...brandDraft, inicial: e.target.value})} maxLength={1} style={{ width:"100%", background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                  </div>
                  <div style={{gridColumn:"1 / -1"}}>
                    <label style={{ fontSize:11, fontWeight:600, color:mutedC, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>Cor Primária</label>
                    <div style={{ display:"flex", gap:8 }}>
                      <input type="color" value={brandDraft.corPrimaria} onChange={e => setBrandDraft({...brandDraft, corPrimaria: e.target.value})} style={{ width:60, height:40, border:`1px solid ${borderC}`, borderRadius:8, cursor:"pointer" }} />
                      <input value={brandDraft.corPrimaria} onChange={e => setBrandDraft({...brandDraft, corPrimaria: e.target.value})} style={{ flex:1, background:inputBg, border:`1px solid ${borderC}`, borderRadius:8, padding:"8px 12px", color:textC, fontSize:13, outline:"none" }} />
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:16 }}>
                  <button onClick={handleSaveBrand} disabled={brandLoading} style={{ flex:1, background:brand.corPrimaria, color:"#fff", border:"none", borderRadius:8, padding:"10px", cursor:"pointer", fontWeight:600, fontSize:13, opacity:brandLoading?0.7:1 }}>Salvar</button>
                  <button onClick={handleResetBrand} style={{ flex:1, background:borderC, color:textC, border:"none", borderRadius:8, padding:"10px", cursor:"pointer", fontWeight:600, fontSize:13 }}>Reset</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOASTS */}
      <div style={{ position:"fixed", bottom:20, right:20, display:"flex", flexDirection:"column", gap:10, zIndex:9999 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
      </div>
    </div>
  );
}
