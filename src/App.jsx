import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const BRAND_DEFAULT = { nome:"Gestify", inicial:"G", subtitulo:"CRM - Controle de Clientes", tagCRM:"CRM IA", corPrimaria:"#8b5cf6" };

async function sbConfig(supabaseUrl, supabaseKey, id, valor=null) {
  if (valor !== null) {
    const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes`, { method:"POST", headers:{"apikey":supabaseKey,"Authorization":`Bearer ${supabaseKey}`,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"}, body:JSON.stringify({id,valor}) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/configuracoes?id=eq.${id}&select=valor`, { headers:{"apikey":supabaseKey,"Authorization":`Bearer ${supabaseKey}`} });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.valor || null;
  } catch { return null; }
}

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://myytrzwiefytbeubaalz.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eXRyendpZWZ5dGJldWJhYWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mzk4ODIsImV4cCI6MjA5MjExNTg4Mn0.Qk_yedbiDNnoGi5xi4bRM-_Yvx-2ce2YOzjf1Qcvr7k";
const EVO_URL = process.env.REACT_APP_EVO_URL || "https://korvax-apps-evolution-api.obeisx.easypanel.host";
const EVO_KEY = process.env.REACT_APP_EVO_KEY || "A22EACBD08B1-4AAC-A51D-57976BE67F73";
const EVO_INST = process.env.REACT_APP_EVO_INST || "crm";

async function sbFetch(path, opts={}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"return=representation",...opts.headers}, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getClients() { return sbFetch("dados_cliente?select=*&order=created_at.desc"); }
async function getCobracas() { return sbFetch("cobrancas?select=*&order=data_vencimento.asc"); }
async function getChatHistory(telefone) {
  const data = await sbFetch(`n8n_chat_histories?session_id=eq.${encodeURIComponent(telefone)}&order=id.asc&limit=100`);
  const messages = (data||[]).map(row => { try { const msg = typeof row.message==="string"?JSON.parse(row.message):row.message; return {id:row.id,type:msg.type==="human"?"human":"ai",content:msg.content||"",hora:new Date(row.created_at||Date.now()).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}; } catch { return null; } }).filter(Boolean);
  return messages.filter((m,i,s)=>i===s.findIndex(x=>x.id===m.id));
}

const TIPO_SERVICO_COLOR = {SITE:"#3b82f6",SOCIAL_MEDIA:"#ec4899",GESTAO_MIDIAS:"#f59e0b",IDENTIDADE_VISUAL:"#10b981",CONSULTORIA:"#8b5cf6",OUTRO:"#4b5563"};
const TIPO_SERVICO_LABEL = {SITE:"Site",SOCIAL_MEDIA:"Social Media",GESTAO_MIDIAS:"Gestão de Mídias",IDENTIDADE_VISUAL:"Identidade Visual",CONSULTORIA:"Consultoria",OUTRO:"Outro"};
const NICHOS = ["E-commerce","Consultórios","Restaurantes","Imobiliária","Advocacia","Educação","Saúde","Beleza","Tecnologia","Varejo","Serviços","Outro"];
const NICHO_COLORS = {"E-commerce":"#ff6b6b","Consultórios":"#4ecdc4","Restaurantes":"#ffe66d","Imobiliária":"#95e1d3","Advocacia":"#a8d8ea","Educação":"#aa96da","Saúde":"#fcbad3","Beleza":"#f8b500","Tecnologia":"#667bc6","Varejo":"#da70d6","Serviços":"#ffa502","Outro":"#6b7280"};
const AV_COLORS = ["#3b82f6","#ec4899","#f59e0b","#10b981","#8b5cf6","#ef4444","#06b6d4","#6366f1"];
const PRIORIDADE_COLOR = {alta:"#ef4444",media:"#f59e0b",baixa:"#10b981"};
const PRIORIDADE_LABEL = {alta:"Alta",media:"Média",baixa:"Baixa"};
const STATUS_KANBAN = ["pendente","em_andamento","concluido"];
const STATUS_KANBAN_LABEL = {pendente:"📋 A Fazer",em_andamento:"⚙️ Em Andamento",concluido:"✅ Concluído"};
const STATUS_KANBAN_COLOR = {pendente:"#6366f1",em_andamento:"#f59e0b",concluido:"#10b981"};

function fmtPhone(t="") { const n=t.replace("@s.whatsapp.net",""); if(n.length<12)return n; return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`; }
function fmtCurrency(v) { if(!v&&v!==0)return "—"; return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}); }
function fmtDate(d) { if(!d)return "—"; return new Date(d).toLocaleDateString("pt-BR"); }
function diasAte(dv) { return Math.ceil((new Date(dv)-new Date())/(1000*60*60*24)); }

function buildGrowthData(clients) {
  const map={};
  clients.forEach(c=>{ const k=new Date(c.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}); map[k]=(map[k]||0)+1; });
  return Object.entries(map).slice(-7).map(([dia,clientes])=>({dia,clientes}));
}
function buildNichoData(clients) {
  const map={};
  clients.forEach(c=>{ const n=c.nicho||"Outro"; map[n]=(map[n]||0)+1; });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([nicho,total])=>({nicho,total,color:NICHO_COLORS[nicho]||"#6b7280"}));
}

function Avatar({name="?",size=36}) {
  const idx=(name||"?").charCodeAt(0)%AV_COLORS.length;
  const initials=(name||"?").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${AV_COLORS[idx]}cc,${AV_COLORS[(idx+2)%AV_COLORS.length]}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.35,color:"#fff",flexShrink:0,border:`1.5px solid ${AV_COLORS[idx]}44`}}>{initials}</div>;
}
function Badge({servico="",onClick}) {
  const c=TIPO_SERVICO_COLOR[servico]||"#4b5563";
  return <span onClick={onClick} style={{background:`${c}15`,color:c,border:`1px solid ${c}35`,borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:onClick?"pointer":"default",whiteSpace:"nowrap"}}>{TIPO_SERVICO_LABEL[servico]||"Sem serviço"}</span>;
}
function Toast({msg,type,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3200);return()=>clearTimeout(t);},[]);
  const colors={ok:"#10b981",warn:"#f59e0b",info:"#3b82f6",err:"#ef4444"};
  return <div style={{background:"#0d1117",color:"#e6edf3",padding:"12px 18px",borderRadius:10,fontWeight:500,fontSize:13,boxShadow:`0 8px 32px rgba(0,0,0,.6)`,display:"flex",alignItems:"center",gap:10,animation:"toastIn .25s ease",border:`1px solid ${colors[type]}30`}}><span style={{width:8,height:8,borderRadius:"50%",background:colors[type],flexShrink:0}}/>{msg}</div>;
}
function Spinner(){return <div style={{width:15,height:15,border:"2px solid #ffffff20",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;}

const Ic=({d,size=16,stroke=1.5})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{Array.isArray(d)?d.map((p,i)=><path key={i} d={p}/>):<path d={d}/>}</svg>;
const IcRect=({rects,size=16,stroke=1.5})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{rects}</svg>;

const ICONS = {
  overview:<IcRect size={15} stroke={1.6} rects={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>}/>,
  clientes:<Ic size={15} stroke={1.6} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>,
  conversas:<Ic size={15} stroke={1.6} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  cobrancas:<Ic size={15} stroke={1.6} d={["M12 2v20m8-10H4","M20 10l2 2m-14 6l-2-2M7 10l-2 2m14 6l2-2"]}/>,
  agenda:<IcRect size={15} stroke={1.6} rects={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>,
  refresh:<Ic size={15} stroke={1.6} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>,
  sun:<Ic size={15} stroke={1.6} d={["M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42","M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"]}/>,
  moon:<Ic size={15} stroke={1.6} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  logout:<Ic size={15} stroke={1.6} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]}/>,
  chevLeft:<Ic size={15} stroke={1.6} d="M15 18l-6-6 6-6"/>,
  chevRight:<Ic size={15} stroke={1.6} d="M9 18l6-6-6-6"/>,
  aparencia:<Ic size={15} stroke={1.6} d={["M12 20h9","M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"]}/>,
  check:<Ic size={14} stroke={2} d="M20 6L9 17l-5-5"/>,
  trash:<Ic size={14} stroke={1.6} d={["M3 6h18","M8 6V4h8v2","M19 6l-1 14H6L5 6"]}/>,
  plus:<Ic size={14} stroke={2} d="M12 5v14M5 12h14"/>,
  x:<Ic size={14} stroke={2} d="M18 6L6 18M6 6l12 12"/>,
  send:<Ic size={14} stroke={1.6} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>,
  dollar:<Ic size={15} stroke={1.5} d={["M12 2v20","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]}/>,
  users2:<Ic size={15} stroke={1.6} d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75","M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"]}/>,
};

function FieldCard({label,value,color,textC,mutedC,borderC,cardBg}) {
  if(!value&&value!==false)return null;
  const accent=color||"#6b7280";
  return <div style={{background:color?`${color}12`:cardBg,border:`1.5px solid ${color?color+"35":borderC}`,borderRadius:14,padding:"11px 13px",position:"relative",overflow:"hidden"}}>{color&&<div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:color,borderRadius:"14px 0 0 14px"}}/>}<div style={{paddingLeft:color?6:0}}><div style={{fontSize:9,color:accent,fontWeight:800,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>{label}</div><div style={{fontSize:13,color:color?accent:textC,fontWeight:600,lineHeight:1.4,wordBreak:"break-word"}}>{value}</div></div></div>;
}

function StatCard({label,value,color,icon,total,cardBg,borderC,mutedC,subC}) {
  const pct=total>0?Math.round((typeof value==="number"?value:0)/total*100):0;
  return <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color}cc,${color}22)`,borderRadius:"14px 14px 0 0"}}/>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontSize:10,color:mutedC,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>
      <div style={{width:28,height:28,borderRadius:8,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",color}}>{icon}</div>
    </div>
    <div style={{fontFamily:"monospace",fontSize:26,fontWeight:800,color,lineHeight:1}}>{value}</div>
    {typeof value==="number"&&<><div style={{marginTop:12,height:3,background:borderC,borderRadius:10}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:10,transition:"width .8s ease"}}/></div><div style={{fontSize:10,color:subC,marginTop:5}}>{pct}% do total</div></>}
  </div>;
}

function Login({onLogin,brand,usuarios}) {
  const [user,setUser]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const handle=async()=>{
    setLoading(true); await new Promise(r=>setTimeout(r,400));
    const lista=usuarios&&usuarios.length>0?usuarios:[{username:"admin",password:"admin123",nome:"Admin",role:"admin"}];
    const found=lista.find(u=>u.username===user.trim()&&u.password===pass);
    if(found)onLogin(found); else{setErr("Usuário ou senha incorretos");setLoading(false);}
  };
  return <div style={{height:"100vh",background:"#05070a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 60% at 50% -10%,${brand.corPrimaria}12 0%,transparent 70%)`,pointerEvents:"none"}}/>
    <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:20,padding:"44px 40px",width:400,boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${brand.corPrimaria},${brand.corPrimaria}88)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22,fontWeight:800,margin:"0 auto 16px"}}>{brand.inicial}</div>
        <div style={{fontWeight:800,fontSize:22,color:"#e6edf3",marginBottom:4}}>{brand.nome}</div>
        <div style={{fontSize:12,color:"#7d8590"}}>{brand.subtitulo}</div>
      </div>
      {[{label:"Usuário",val:user,set:setUser,type:"text",ph:"admin"},{label:"Senha",val:pass,set:setPass,type:"password",ph:"••••••••"}].map(f=>(
        <div key={f.label} style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:"#7d8590",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{f.label}</label>
          <input value={f.val} onChange={e=>{f.set(e.target.value);setErr("");}} type={f.type} placeholder={f.ph} onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:10,padding:"11px 14px",color:"#e6edf3",fontSize:14,outline:"none",boxSizing:"border-box"}}
            onFocus={e=>{e.target.style.borderColor=brand.corPrimaria;e.target.style.boxShadow=`0 0 0 3px ${brand.corPrimaria}20`;}} onBlur={e=>{e.target.style.borderColor="#30363d";e.target.style.boxShadow="none";}}/>
        </div>
      ))}
      {err&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,textAlign:"center",padding:8,background:"#ef444410",borderRadius:8,border:"1px solid #ef444430"}}>{err}</div>}
      <button onClick={handle} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${brand.corPrimaria},${brand.corPrimaria}cc)`,color:"#fff",border:"none",borderRadius:10,padding:13,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?.7:1}}>
        {loading?<><Spinner/>Entrando...</>:"Entrar"}
      </button>
    </div>
  </div>;
}

function ClientDrawer({client,onClose,onToggleIA,onChangeServico,brand,dark,cardBg,borderC,textC,mutedC}) {
  if(!client)return null;
  return <div style={{position:"fixed",top:0,right:0,bottom:0,width:360,background:cardBg,borderLeft:`1px solid ${borderC}`,zIndex:200,display:"flex",flexDirection:"column",boxShadow:"-20px 0 60px rgba(0,0,0,.4)",animation:"slideIn .25s ease"}}>
    <div style={{padding:"18px 20px",borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontSize:14,fontWeight:700,color:textC}}>Detalhes do Cliente</div>
      <button onClick={onClose} style={{background:"none",border:`1px solid ${borderC}`,borderRadius:8,color:mutedC,padding:"5px 7px",cursor:"pointer",display:"flex"}}>{ICONS.x}</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:20}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:20,padding:20,background:`${brand.corPrimaria}08`,borderRadius:14,border:`1px solid ${brand.corPrimaria}20`}}>
        <Avatar name={client.nomewpp} size={56}/>
        <div style={{marginTop:12,fontWeight:700,fontSize:16,color:textC}}>{client.nomewpp}</div>
        <div style={{fontSize:12,color:mutedC,marginTop:4}}>{fmtPhone(client.telefone)}</div>
        <div style={{marginTop:12,display:"flex",gap:8}}>
          <Badge servico={client.tipo_servico}/>
          <span style={{fontSize:11,fontWeight:700,color:client.atendimento_ia==="pause"?"#f59e0b":"#10b981",background:client.atendimento_ia==="pause"?"#f59e0b15":"#10b98115",padding:"3px 8px",borderRadius:4,border:`1px solid ${client.atendimento_ia==="pause"?"#f59e0b30":"#10b98130"}`}}>{client.atendimento_ia==="pause"?"IA Pausada":"IA Ativa"}</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <FieldCard label="Nicho" value={client.nicho||"—"} color={NICHO_COLORS[client.nicho]} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
        <FieldCard label="Telefone" value={fmtPhone(client.telefone)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
        <FieldCard label="Cadastrado em" value={fmtDate(client.created_at)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
      </div>
      <div style={{marginTop:20}}>
        <div style={{fontSize:11,fontWeight:700,color:mutedC,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Alterar Serviço</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {Object.entries(TIPO_SERVICO_LABEL).map(([k,v])=>{const active=client.tipo_servico===k;const c=TIPO_SERVICO_COLOR[k];return <button key={k} onClick={()=>onChangeServico(client.id,k)} style={{background:active?`${c}20`:"transparent",border:`1px solid ${active?c+"60":borderC}`,color:active?c:mutedC,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>{v}</button>;})}
        </div>
      </div>
      <button onClick={()=>onToggleIA(client)} style={{width:"100%",marginTop:20,background:client.atendimento_ia==="pause"?"#10b98120":"#f59e0b20",color:client.atendimento_ia==="pause"?"#10b981":"#f59e0b",border:`1px solid ${client.atendimento_ia==="pause"?"#10b98140":"#f59e0b40"}`,borderRadius:10,padding:11,cursor:"pointer",fontWeight:700,fontSize:13}}>
        {client.atendimento_ia==="pause"?"▶ Ativar IA":"⏸ Pausar IA"}
      </button>
    </div>
  </div>;
}

function AgendaTab({dark,cardBg,borderC,textC,mutedC,subC,inputBg,brand,toast}) {
  const [tarefas,setTarefas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [draft,setDraft]=useState({titulo:"",descricao:"",prioridade:"media",data:"",status:"pendente"});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    setLoading(true);
    sbConfig(SUPABASE_URL,SUPABASE_KEY,"agenda").then(val=>{if(val&&Array.isArray(val))setTarefas(val);}).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  async function saveTarefas(lista){setTarefas(lista);try{await sbConfig(SUPABASE_URL,SUPABASE_KEY,"agenda",lista);}catch(e){toast("Erro ao salvar: "+e.message,"err");}}

  async function adicionarTarefa(){
    if(!draft.titulo.trim()){toast("Informe o título","err");return;}
    setSaving(true);
    const nova={id:Date.now(),...draft,criado_em:new Date().toISOString()};
    await saveTarefas([...tarefas,nova]);
    setDraft({titulo:"",descricao:"",prioridade:"media",data:"",status:"pendente"});
    setShowForm(false);setSaving(false);toast("Tarefa criada!","ok");
  }
  async function moverTarefa(id,s){await saveTarefas(tarefas.map(t=>t.id===id?{...t,status:s}:t));}
  async function deletarTarefa(id){await saveTarefas(tarefas.filter(t=>t.id!==id));toast("Tarefa removida","warn");}

  if(loading)return <div style={{textAlign:"center",padding:60,color:mutedC}}>Carregando agenda...</div>;

  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div><div style={{fontSize:14,fontWeight:700,color:textC}}>Quadro de Tarefas</div><div style={{fontSize:12,color:mutedC,marginTop:2}}>{tarefas.length} tarefa(s)</div></div>
      <button onClick={()=>setShowForm(!showForm)} style={{background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{ICONS.plus} Nova Tarefa</button>
    </div>
    {showForm&&<div style={{background:cardBg,border:`1px solid ${brand.corPrimaria}40`,borderRadius:14,padding:20,marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:700,color:textC,marginBottom:14}}>Nova Tarefa</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <input placeholder="Título *" value={draft.titulo} onChange={e=>setDraft({...draft,titulo:e.target.value})} style={{gridColumn:"1/-1",background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
        <input placeholder="Descrição" value={draft.descricao} onChange={e=>setDraft({...draft,descricao:e.target.value})} style={{gridColumn:"1/-1",background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
        <select value={draft.prioridade} onChange={e=>setDraft({...draft,prioridade:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}>
          <option value="alta">Prioridade Alta</option><option value="media">Prioridade Média</option><option value="baixa">Prioridade Baixa</option>
        </select>
        <input type="date" value={draft.data} onChange={e=>setDraft({...draft,data:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={adicionarTarefa} disabled={saving} style={{flex:1,background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:8,padding:10,cursor:"pointer",fontWeight:700,fontSize:13,opacity:saving?.7:1}}>{saving?"Salvando...":"Criar Tarefa"}</button>
        <button onClick={()=>setShowForm(false)} style={{flex:1,background:"transparent",color:mutedC,border:`1px solid ${borderC}`,borderRadius:8,padding:10,cursor:"pointer",fontWeight:600,fontSize:13}}>Cancelar</button>
      </div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {STATUS_KANBAN.map(status=>{
        const col=tarefas.filter(t=>t.status===status);
        const cc=STATUS_KANBAN_COLOR[status];
        return <div key={status} style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"13px 15px",borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700,color:textC}}>{STATUS_KANBAN_LABEL[status]}</div>
            <div style={{background:`${cc}20`,color:cc,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{col.length}</div>
          </div>
          <div style={{padding:10,display:"flex",flexDirection:"column",gap:8,minHeight:180}}>
            {col.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:subC,fontSize:12}}>Vazio</div>}
            {col.map(t=>{const pc=PRIORIDADE_COLOR[t.prioridade]||"#6b7280"; return <div key={t.id} style={{background:dark?"#161b22":"#f8fafc",border:`1px solid ${borderC}`,borderRadius:10,padding:11,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:pc,borderRadius:"10px 0 0 10px"}}/>
              <div style={{paddingLeft:8}}>
                <div style={{fontSize:12,fontWeight:700,color:textC,marginBottom:4}}>{t.titulo}</div>
                {t.descricao&&<div style={{fontSize:11,color:mutedC,marginBottom:8,lineHeight:1.4}}>{t.descricao}</div>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:9,fontWeight:800,color:pc,background:`${pc}15`,padding:"2px 6px",borderRadius:4,textTransform:"uppercase"}}>{PRIORIDADE_LABEL[t.prioridade]}</span>
                    {t.data&&<span style={{fontSize:10,color:mutedC}}>{fmtDate(t.data)}</span>}
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {status!=="concluido"&&<button onClick={()=>moverTarefa(t.id,status==="pendente"?"em_andamento":"concluido")} style={{background:`${STATUS_KANBAN_COLOR[status==="pendente"?"em_andamento":"concluido"]}20`,border:"none",borderRadius:4,color:STATUS_KANBAN_COLOR[status==="pendente"?"em_andamento":"concluido"],padding:"3px 4px",cursor:"pointer",display:"flex"}}>{ICONS.chevRight}</button>}
                    {status!=="pendente"&&<button onClick={()=>moverTarefa(t.id,status==="concluido"?"em_andamento":"pendente")} style={{background:`${borderC}80`,border:"none",borderRadius:4,color:mutedC,padding:"3px 4px",cursor:"pointer",display:"flex"}}>{ICONS.chevLeft}</button>}
                    <button onClick={()=>deletarTarefa(t.id)} style={{background:"#ef444420",border:"none",borderRadius:4,color:"#ef4444",padding:"3px 4px",cursor:"pointer",display:"flex"}}>{ICONS.trash}</button>
                  </div>
                </div>
              </div>
            </div>;})}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

export default function App() {
  const [loggedIn,setLoggedIn]=useState(()=>localStorage.getItem("fd_auth")==="1");
  const [dark,setDark]=useState(()=>localStorage.getItem("fd_dark")!=="0");
  const [tab,setTab]=useState("overview");
  const [clients,setClients]=useState([]);
  const [cobrancas,setCobrancas]=useState([]);
  const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  const [filterServico,setFilterServico]=useState("TODOS");
  const [filterNicho,setFilterNicho]=useState("TODOS");
  const [toasts,setToasts]=useState([]);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [msgInput,setMsgInput]=useState("");
  const [sending,setSending]=useState(false);
  const [evoStatus,setEvoStatus]=useState("checking");
  const [chatHistory,setChatHistory]=useState([]);
  const [loadingChat,setLoadingChat]=useState(false);
  const [convSearch,setConvSearch]=useState("");
  const [drawerClient,setDrawerClient]=useState(null);
  const chatEndRef=useRef(null);

  const [brand,setBrand]=useState(BRAND_DEFAULT);
  const [brandDraft,setBrandDraft]=useState(BRAND_DEFAULT);
  const [brandLoading,setBrandLoading]=useState(false);

  const [loggedUser,setLoggedUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("fd_user")||"null");}catch{return null;}});
  const [usuarios,setUsuarios]=useState([]);
  const [plano,setPlano]=useState({maxUsuarios:2,nome:"Starter",vencimento:null,status:"ativo",preco:0,contatoVendas:""});
  const [usuariosLoading,setUsuariosLoading]=useState(false);
  const [newUsername,setNewUsername]=useState(""); const [newPassword,setNewPassword]=useState(""); const [newNome,setNewNome]=useState(""); const [newRole,setNewRole]=useState("usuario");
  const [usuariosSubTab,setUsuariosSubTab]=useState("usuarios");
  const [novaCobrancaModal,setNovaCobrancaModal]=useState(false);
  const [novaCobranca,setNovaCobranca]=useState({cliente_id:"",descricao:"",valor:"",data_vencimento:"",tipo_recorrencia:"mensal",status:"ativa",webhook_url:""});

  useEffect(()=>{
    sbConfig(SUPABASE_URL,SUPABASE_KEY,"brand").then(val=>{if(val){setBrand({...BRAND_DEFAULT,...val});setBrandDraft({...BRAND_DEFAULT,...val});}});
    sbConfig(SUPABASE_URL,SUPABASE_KEY,"usuarios").then(val=>{if(val)setUsuarios(val);});
    sbConfig(SUPABASE_URL,SUPABASE_KEY,"plano").then(val=>{if(val)setPlano({maxUsuarios:2,nome:"Starter",vencimento:null,status:"ativo",preco:0,contatoVendas:"",...val});});
  },[]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatHistory]);
  useEffect(()=>{ if(!selected)return; setChatHistory([]); setLoadingChat(true); getChatHistory(selected.telefone).then(h=>setChatHistory(h)).catch(()=>{}).finally(()=>setLoadingChat(false)); },[selected?.telefone]);

  async function loadClients(){
    setLoading(true);
    try{const [cd,cob]=await Promise.all([getClients(),getCobracas().catch(()=>[])]);setClients(cd||[]);setCobrancas(cob||[]);}
    catch(e){toast("Erro ao carregar: "+e.message,"err");}finally{setLoading(false);}
  }
  async function checkEvolution(){try{const r=await fetch(`${EVO_URL}/instance/fetchInstances`,{headers:{"apikey":EVO_KEY}});setEvoStatus(r.ok?"ok":"err");}catch{setEvoStatus("err");}}
  useEffect(()=>{if(loggedIn){loadClients();checkEvolution();}},[loggedIn]);
  useEffect(()=>{if(!loggedIn)return;const t=setInterval(loadClients,30000);return()=>clearInterval(t);},[loggedIn]);

  function toast(msg,type="ok"){const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3200);}

  async function toggleIA(client,e){
    e?.stopPropagation();
    const next=client.atendimento_ia==="pause"?"ativo":"pause";
    const upd=c=>c.id===client.id?{...c,atendimento_ia:next}:c;
    setClients(p=>p.map(upd));if(selected?.id===client.id)setSelected(s=>({...s,atendimento_ia:next}));if(drawerClient?.id===client.id)setDrawerClient(d=>({...d,atendimento_ia:next}));
    try{await sbFetch(`dados_cliente?telefone=eq.${encodeURIComponent(client.telefone)}`,{method:"PATCH",body:JSON.stringify({atendimento_ia:next})});toast(next==="pause"?`IA pausada — ${client.nomewpp}`:`IA ativada — ${client.nomewpp}`,next==="pause"?"warn":"ok");}
    catch(e){setClients(p=>p.map(c=>c.id===client.id?{...c,atendimento_ia:client.atendimento_ia}:c));toast("Erro: "+e.message,"err");}
  }
  async function changeServico(id,servico){
    const client=clients.find(c=>c.id===id);
    const upd=c=>c.id===id?{...c,tipo_servico:servico}:c;
    setClients(p=>p.map(upd));if(selected?.id===id)setSelected(s=>({...s,tipo_servico:servico}));if(drawerClient?.id===id)setDrawerClient(d=>({...d,tipo_servico:servico}));
    try{await sbFetch(`dados_cliente?telefone=eq.${encodeURIComponent(client.telefone)}`,{method:"PATCH",body:JSON.stringify({tipo_servico:servico})});toast(`Serviço → ${TIPO_SERVICO_LABEL[servico]||"Sem serviço"}`,"info");}
    catch(e){setClients(p=>p.map(c=>c.id===id?{...c,tipo_servico:client.tipo_servico}:c));toast("Erro: "+e.message,"err");}
  }
  async function sendMessage(){
    if(!msgInput.trim()||!selected||sending)return;
    setSending(true);const texto=msgInput;
    try{const num=selected.telefone.replace("@s.whatsapp.net","");const r=await fetch(`${EVO_URL}/message/sendText/${EVO_INST}`,{method:"POST",headers:{"apikey":EVO_KEY,"Content-Type":"application/json"},body:JSON.stringify({number:num,text:texto,delay:1200})});if(!r.ok)throw new Error(await r.text());toast("Enviado!","ok");setMsgInput("");const h=await getChatHistory(selected.telefone);setChatHistory(h);}
    catch(e){toast("Erro: "+e.message,"err");}finally{setSending(false);}
  }
  async function criarCobranca(){
    if(!novaCobranca.cliente_id||!novaCobranca.valor||!novaCobranca.data_vencimento){toast("Preencha todos os campos","err");return;}
    try{await sbFetch("cobrancas",{method:"POST",body:JSON.stringify({...novaCobranca,id:Date.now()})});if(novaCobranca.webhook_url)fetch(novaCobranca.webhook_url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipo:"cobranca_criada",cobranca:novaCobranca,data:new Date().toISOString()})}).catch(()=>{});toast("Cobrança criada!","ok");setNovaCobranca({cliente_id:"",descricao:"",valor:"",data_vencimento:"",tipo_recorrencia:"mensal",status:"ativa",webhook_url:""});setNovaCobrancaModal(false);loadClients();}
    catch(e){toast("Erro: "+e.message,"err");}
  }
  async function marcarComoPago(cob){
    try{await sbFetch(`cobrancas?id=eq.${cob.id}`,{method:"PATCH",body:JSON.stringify({status:"pago"})});setCobrancas(p=>p.map(c=>c.id===cob.id?{...c,status:"pago"}:c));toast("Marcada como paga!","ok");}
    catch(e){toast("Erro: "+e.message,"err");}
  }
  async function adicionarUsuario(){
    if(!newUsername.trim()||!newPassword.trim()||!newNome.trim()){toast("Preencha todos os campos","err");return;}
    if(usuarios.some(u=>u.username===newUsername.trim())){toast("Usuário já existe","err");return;}
    if(usuarios.length>=plano.maxUsuarios){toast(`Limite de ${plano.maxUsuarios} usuários atingido`,"warn");return;}
    setUsuariosLoading(true);
    try{const nova=[...usuarios,{username:newUsername.trim(),password:newPassword,nome:newNome.trim(),role:newRole}];await sbConfig(SUPABASE_URL,SUPABASE_KEY,"usuarios",nova);setUsuarios(nova);setNewUsername("");setNewPassword("");setNewNome("");setNewRole("usuario");toast("Usuário adicionado!","ok");}
    catch(e){toast("Erro: "+e.message,"err");}finally{setUsuariosLoading(false);}
  }
  async function removerUsuario(username){
    if(username===loggedUser?.username){toast("Não pode se remover","err");return;}
    setUsuariosLoading(true);
    try{const nova=usuarios.filter(u=>u.username!==username);await sbConfig(SUPABASE_URL,SUPABASE_KEY,"usuarios",nova);setUsuarios(nova);toast("Removido","warn");}
    catch(e){toast("Erro: "+e.message,"err");}finally{setUsuariosLoading(false);}
  }
  async function handleSaveBrand(){
    setBrandLoading(true);
    try{await sbConfig(SUPABASE_URL,SUPABASE_KEY,"brand",brandDraft);setBrand(brandDraft);toast("Aparência salva!","ok");}
    catch(e){toast("Erro: "+e.message,"err");}finally{setBrandLoading(false);}
  }

  const total=clients.length;
  const ativos=clients.filter(c=>c.atendimento_ia!=="pause").length;
  const pausados=clients.filter(c=>c.atendimento_ia==="pause").length;
  const cobrancasVencendo=cobrancas.filter(c=>{const d=diasAte(c.data_vencimento);return d<=7&&d>0&&c.status==="ativa";});
  const cobrancasVencidas=cobrancas.filter(c=>{const d=diasAte(c.data_vencimento);return d<0&&c.status==="ativa";});
  const receitaTotal=cobrancas.filter(c=>c.status==="pago").reduce((a,c)=>a+Number(c.valor||0),0);
  const filtered=clients.filter(c=>{const s=search.toLowerCase();return(c.nomewpp?.toLowerCase().includes(s)||c.telefone?.includes(s))&&(filterServico==="TODOS"||c.tipo_servico===filterServico)&&(filterNicho==="TODOS"||c.nicho===filterNicho);});
  const convFiltered=clients.filter(c=>{const s=convSearch.toLowerCase();return c.nomewpp?.toLowerCase().includes(s)||c.telefone?.includes(s);});
  const growthData=buildGrowthData(clients);
  const nichoData=buildNichoData(clients);
  const pieData=Object.entries(TIPO_SERVICO_LABEL).filter(([k])=>k!=="OUTRO").map(([key,label])=>({name:label,value:clients.filter(c=>c.tipo_servico===key).length,color:TIPO_SERVICO_COLOR[key]})).filter(d=>d.value>0);
  const isAdmin=!loggedUser||loggedUser.role==="admin";

  function exportCSV(){
    const cols=["nomewpp","telefone","tipo_servico","nicho","atendimento_ia","created_at"];
    const rows=filtered.map(c=>cols.map(k=>`"${String(c[k]??""").replace(/"/g,'""')}"`).join(";"));
    const blob=new Blob(["﻿"+[cols.join(";"),...rows].join("
")],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="clientes_crm.csv";a.click();
    toast("CSV exportado!","ok");
  }

  const NAV=[
    {id:"overview",icon:ICONS.overview,label:"Visão Geral"},
    {id:"clientes",icon:ICONS.clientes,label:"Clientes"},
    {id:"cobrancas",icon:ICONS.cobrancas,label:"Cobranças"},
    {id:"conversas",icon:ICONS.conversas,label:"Conversas"},
    {id:"agenda",icon:ICONS.agenda,label:"Agenda"},
    ...(isAdmin?[{id:"usuarios",icon:ICONS.users2,label:"Usuários"},{id:"aparencia",icon:ICONS.aparencia,label:"Aparência"}]:[]),
  ];

  if(!loggedIn)return <Login onLogin={(u)=>{localStorage.setItem("fd_auth","1");localStorage.setItem("fd_user",JSON.stringify(u));setLoggedIn(true);setLoggedUser(u);}} brand={brand} usuarios={usuarios}/>;

  const bg=dark?"#05070a":"#f0f2f5";
  const cardBg=dark?"#0d1117":"#ffffff";
  const borderC=dark?"#21262d":"#e2e8f0";
  const textC=dark?"#e6edf3":"#0f172a";
  const mutedC=dark?"#7d8590":"#64748b";
  const subC=dark?"#4b5563":"#94a3b8";
  const inputBg=dark?"#161b22":"#f8fafc";
  const rowHov=dark?"#161b2250":"#f1f5f960";

  return <div style={{display:"flex",height:"100vh",background:bg,color:textC,fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${borderC};border-radius:10px;}
      .hrow:hover{background:${rowHov} !important;}
      @keyframes toastIn{0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}
      @keyframes spin{to{transform:rotate(360deg);}}
      @keyframes slideIn{0%{transform:translateX(40px);opacity:0;}100%{transform:translateX(0);opacity:1;}}
      input[type='date']::-webkit-calendar-picker-indicator{filter:${dark?"invert(1)":"none"};opacity:0.5;}
    `}</style>

    {/* SIDEBAR */}
    <div style={{width:sidebarOpen?220:60,background:cardBg,borderRight:`1px solid ${borderC}`,display:"flex",flexDirection:"column",transition:"width .25s",overflow:"hidden",flexShrink:0}}>
      <div style={{padding:"18px 14px",borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:65}}>
        {sidebarOpen&&<div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${brand.corPrimaria},${brand.corPrimaria}88)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,flexShrink:0}}>{brand.inicial}</div>
          <div><div style={{fontWeight:800,fontSize:13,color:textC}}>{brand.nome}</div><div style={{fontSize:9,color:mutedC,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{brand.tagCRM}</div></div>
        </div>}
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"none",border:"none",cursor:"pointer",color:mutedC,padding:4,borderRadius:6,display:"flex"}}>{sidebarOpen?ICONS.chevLeft:ICONS.chevRight}</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
        {NAV.map(nav=>(
          <button key={nav.id} onClick={()=>setTab(nav.id)} title={!sidebarOpen?nav.label:""} style={{width:"100%",background:tab===nav.id?`${brand.corPrimaria}20`:"transparent",border:tab===nav.id?`1px solid ${brand.corPrimaria}35`:"1px solid transparent",color:tab===nav.id?brand.corPrimaria:mutedC,borderRadius:9,padding:sidebarOpen?"9px 10px":"10px",marginBottom:4,display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .15s",justifyContent:sidebarOpen?"flex-start":"center"}}>
            {nav.icon}{sidebarOpen&&<span>{nav.label}</span>}
          </button>
        ))}
      </div>
      <div style={{padding:"10px 8px",borderTop:`1px solid ${borderC}`,display:"flex",flexDirection:sidebarOpen?"row":"column",gap:6}}>
        {sidebarOpen&&loggedUser&&<div style={{flex:1,fontSize:11,color:mutedC,paddingLeft:4,overflow:"hidden"}}><div style={{fontWeight:600,color:textC,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loggedUser.nome}</div><div style={{fontSize:10}}>@{loggedUser.username}</div></div>}
        <button onClick={()=>{setDark(!dark);localStorage.setItem("fd_dark",String(!dark));}} style={{background:"none",border:`1px solid ${borderC}`,borderRadius:8,color:mutedC,padding:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?ICONS.sun:ICONS.moon}</button>
        <button onClick={()=>{localStorage.removeItem("fd_auth");localStorage.removeItem("fd_user");setLoggedIn(false);}} style={{background:"none",border:`1px solid ${borderC}`,borderRadius:8,color:mutedC,padding:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ICONS.logout}</button>
      </div>
    </div>

    {/* MAIN */}
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:cardBg,borderBottom:`1px solid ${borderC}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:57}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h1 style={{fontSize:16,fontWeight:800,color:textC}}>{NAV.find(n=>n.id===tab)?.label||"Dashboard"}</h1>
          {evoStatus==="ok"&&<span style={{fontSize:10,color:"#10b981",fontWeight:700,background:"#10b98115",padding:"2px 8px",borderRadius:20,border:"1px solid #10b98130"}}>● Evolution API</span>}
          {evoStatus==="err"&&<span style={{fontSize:10,color:"#ef4444",fontWeight:700,background:"#ef444415",padding:"2px 8px",borderRadius:20,border:"1px solid #ef444430"}}>● Offline</span>}
        </div>
        <button onClick={loadClients} style={{background:`${brand.corPrimaria}18`,border:`1px solid ${brand.corPrimaria}30`,color:brand.corPrimaria,borderRadius:9,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>{ICONS.refresh} Atualizar</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:20}}>
        {loading&&<div style={{textAlign:"center",padding:60,color:mutedC}}>Carregando dados...</div>}

        {!loading&&tab==="overview"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:20}}>
            <StatCard label="Total de Clientes" value={total} color={brand.corPrimaria} icon={ICONS.clientes} total={total||1} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC}/>
            <StatCard label="Clientes Ativos" value={ativos} color="#10b981" icon={<Ic size={14} stroke={2} d="M20 6L9 17l-5-5"/>} total={total||1} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC}/>
            <StatCard label="IA Pausada" value={pausados} color="#f59e0b" icon={<Ic size={14} stroke={2} d="M10 9v6m4-6v6"/>} total={total||1} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC}/>
            <StatCard label="Receita Recebida" value={fmtCurrency(receitaTotal)} color="#6366f1" icon={ICONS.dollar} total={1} cardBg={cardBg} borderC={borderC} mutedC={mutedC} subC={subC}/>
          </div>
          {cobrancasVencidas.length>0&&<div style={{background:"#ef444414",border:"1px solid #ef444430",borderRadius:12,padding:"14px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>⚠️</span>
            <div><div style={{color:"#ef4444",fontWeight:700,fontSize:13}}>{cobrancasVencidas.length} cobrança(s) vencida(s)</div><div style={{fontSize:11,color:mutedC,marginTop:2}}>{cobrancasVencidas.map(c=>c.descricao).join(", ")}</div></div>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:18}}>
              <div style={{fontSize:13,fontWeight:700,color:textC,marginBottom:14}}>Crescimento (últimos 7 dias)</div>
              <ResponsiveContainer width="100%" height={220}><LineChart data={growthData}><CartesianGrid stroke={borderC} strokeDasharray="4 4"/><XAxis dataKey="dia" stroke={mutedC} style={{fontSize:11}}/><YAxis stroke={mutedC} style={{fontSize:11}}/><Tooltip contentStyle={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:10,fontSize:12}}/><Line type="monotone" dataKey="clientes" stroke={brand.corPrimaria} strokeWidth={2.5} dot={{fill:brand.corPrimaria,r:4}} activeDot={{r:6}}/></LineChart></ResponsiveContainer>
            </div>
            <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:18}}>
              <div style={{fontSize:13,fontWeight:700,color:textC,marginBottom:14}}>Serviços em Demanda</div>
              <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:10,fontSize:12}}/></PieChart></ResponsiveContainer>
            </div>
          </div>
          {nichoData.length>0&&<div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:textC,marginBottom:14}}>Distribuição por Nicho</div>
            <ResponsiveContainer width="100%" height={200}><BarChart data={nichoData} layout="vertical" margin={{left:10}}><XAxis type="number" stroke={mutedC} style={{fontSize:11}}/><YAxis type="category" dataKey="nicho" width={110} stroke={mutedC} style={{fontSize:11}}/><Tooltip contentStyle={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:10,fontSize:12}}/><Bar dataKey="total" radius={[0,6,6,0]}>{nichoData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart></ResponsiveContainer>
          </div>}
        </div>}

        {!loading&&tab==="clientes"&&<div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <input placeholder="Buscar por nome ou telefone..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:200,background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"8px 12px",color:textC,fontSize:13,outline:"none"}}/>
            <select value={filterServico} onChange={e=>setFilterServico(e.target.value)} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"8px 12px",color:textC,fontSize:13,outline:"none"}}>
              <option value="TODOS">Todos Serviços ({total})</option>
              {Object.entries(TIPO_SERVICO_LABEL).filter(([k])=>k!=="OUTRO").map(([k,v])=>{const count=clients.filter(c=>c.tipo_servico===k).length;return <option key={k} value={k}>{v} ({count})</option>;})}
            </select>
            <select value={filterNicho} onChange={e=>setFilterNicho(e.target.value)} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"8px 12px",color:textC,fontSize:13,outline:"none"}}>
              <option value="TODOS">Todos Nichos</option>
              {NICHOS.map(n=>{const count=clients.filter(c=>c.nicho===n).length;return count>0?<option key={n} value={n}>{n} ({count})</option>:null;})}
            </select>
            <button onClick={exportCSV} style={{background:`${brand.corPrimaria}18`,border:`1px solid ${brand.corPrimaria}30`,color:brand.corPrimaria,borderRadius:9,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>Exportar CSV</button>
          </div>
          <div style={{fontSize:11,color:mutedC,marginBottom:10,fontWeight:600}}>{filtered.length} cliente(s)</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.length===0?<div style={{textAlign:"center",padding:60,color:subC}}><div style={{fontSize:32,marginBottom:8}}>🔍</div>Nenhum cliente encontrado</div>:
            filtered.map(client=>(
              <div key={client.id} onClick={()=>setDrawerClient(drawerClient?.id===client.id?null:client)} className="hrow"
                style={{background:drawerClient?.id===client.id?`${brand.corPrimaria}15`:cardBg,border:drawerClient?.id===client.id?`1px solid ${brand.corPrimaria}40`:`1px solid ${borderC}`,borderRadius:10,padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                  <Avatar name={client.nomewpp} size={38}/>
                  <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:textC}}>{client.nomewpp}</div><div style={{fontSize:11,color:mutedC}}>{fmtPhone(client.telefone)}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  {client.nicho&&<span style={{fontSize:10,color:NICHO_COLORS[client.nicho]||mutedC,fontWeight:700,background:`${NICHO_COLORS[client.nicho]||"#6b7280"}15`,padding:"2px 7px",borderRadius:4}}>{client.nicho}</span>}
                  <Badge servico={client.tipo_servico}/>
                  <button onClick={e=>toggleIA(client,e)} style={{background:`${client.atendimento_ia==="pause"?"#f59e0b":"#10b981"}18`,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700,color:client.atendimento_ia==="pause"?"#f59e0b":"#10b981"}}>{client.atendimento_ia==="pause"?"Pausado":"Ativo"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {!loading&&tab==="cobrancas"&&<div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <button onClick={()=>setNovaCobrancaModal(true)} style={{background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{ICONS.plus} Nova Cobrança</button>
            <div style={{fontSize:12,color:mutedC}}>{cobrancas.filter(c=>c.status!=="pago").length} ativa(s) · {cobrancas.filter(c=>c.status==="pago").length} paga(s)</div>
          </div>
          {novaCobrancaModal&&<div style={{background:cardBg,border:`1px solid ${brand.corPrimaria}40`,borderRadius:14,padding:20,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:textC,marginBottom:16}}>Nova Cobrança</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <select value={novaCobranca.cliente_id} onChange={e=>setNovaCobranca({...novaCobranca,cliente_id:e.target.value})} style={{gridColumn:"1/-1",background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}>
                <option value="">Selecionar Cliente *</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.nomewpp}</option>)}
              </select>
              <input placeholder="Descrição *" value={novaCobranca.descricao} onChange={e=>setNovaCobranca({...novaCobranca,descricao:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
              <input placeholder="Valor *" type="number" value={novaCobranca.valor} onChange={e=>setNovaCobranca({...novaCobranca,valor:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
              <input type="date" value={novaCobranca.data_vencimento} onChange={e=>setNovaCobranca({...novaCobranca,data_vencimento:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
              <select value={novaCobranca.tipo_recorrencia} onChange={e=>setNovaCobranca({...novaCobranca,tipo_recorrencia:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}>
                <option value="mensal">Mensal</option><option value="trimestral">Trimestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option><option value="unica">Única</option>
              </select>
              <input placeholder="Webhook URL (opcional)" value={novaCobranca.webhook_url} onChange={e=>setNovaCobranca({...novaCobranca,webhook_url:e.target.value})} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={criarCobranca} style={{flex:1,background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:8,padding:10,cursor:"pointer",fontWeight:700,fontSize:13}}>Criar Cobrança</button>
              <button onClick={()=>setNovaCobrancaModal(false)} style={{flex:1,background:"transparent",color:mutedC,border:`1px solid ${borderC}`,borderRadius:8,padding:10,cursor:"pointer",fontWeight:600,fontSize:13}}>Cancelar</button>
            </div>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cobrancas.length===0?<div style={{textAlign:"center",padding:60,color:subC}}><div style={{fontSize:32,marginBottom:8}}>💰</div>Nenhuma cobrança</div>:
            cobrancas.map(cob=>{
              const dias=diasAte(cob.data_vencimento);const pago=cob.status==="pago";
              const sc=pago?"#10b981":dias<0?"#ef4444":dias<=7?"#f59e0b":mutedC;
              const cliente=clients.find(c=>String(c.id)===String(cob.cliente_id));
              return <div key={cob.id} style={{background:cardBg,border:`1px solid ${pago?"#10b98130":borderC}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:pago?.7:1}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:textC}}>{cob.descricao}</div><div style={{fontSize:11,color:mutedC,marginTop:2}}>{cliente?.nomewpp||"Cliente desconhecido"}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:14,color:textC}}>{fmtCurrency(cob.valor)}</div><div style={{fontSize:11,color:sc,fontWeight:600,marginTop:2}}>{pago?"✓ Pago":dias<0?`${Math.abs(dias)}d atrasado`:dias===0?"Vence hoje":`${dias}d restantes`}</div></div>
                  <span style={{fontSize:10,background:`${sc}18`,color:sc,padding:"3px 8px",borderRadius:6,fontWeight:700,textTransform:"uppercase"}}>{cob.tipo_recorrencia}</span>
                  {!pago&&<button onClick={()=>marcarComoPago(cob)} style={{background:"#10b98120",color:"#10b981",border:"1px solid #10b98130",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{ICONS.check} Pago</button>}
                </div>
              </div>;
            })}
          </div>
        </div>}

        {!loading&&tab==="conversas"&&<div style={{display:"grid",gridTemplateColumns:"240px 1fr 280px",gap:14,height:"calc(100vh - 130px)"}}>
          <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"10px 12px",borderBottom:`1px solid ${borderC}`}}>
              <input placeholder="Buscar..." value={convSearch} onChange={e=>setConvSearch(e.target.value)} style={{width:"100%",background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"7px 10px",color:textC,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {convFiltered.map(c=><div key={c.id} onClick={()=>setSelected(c)} className="hrow" style={{padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${borderC}`,background:selected?.id===c.id?`${brand.corPrimaria}18`:"transparent"}}>
                <Avatar name={c.nomewpp} size={32}/><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:textC,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nomewpp}</div><div style={{fontSize:10,color:mutedC}}>{fmtPhone(c.telefone)}</div></div>
              </div>)}
            </div>
          </div>
          <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {selected?<>
              <div style={{padding:"11px 15px",borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",gap:10}}>
                <Avatar name={selected.nomewpp} size={30}/><div><div style={{fontSize:13,fontWeight:700,color:textC}}>{selected.nomewpp}</div><div style={{fontSize:10,color:mutedC}}>{fmtPhone(selected.telefone)}</div></div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
                {loadingChat?<div style={{textAlign:"center",padding:20,color:mutedC}}>Carregando...</div>:chatHistory.length===0?<div style={{textAlign:"center",padding:20,color:subC,fontSize:12}}>Nenhuma mensagem</div>:
                chatHistory.map(msg=><div key={msg.id} style={{display:"flex",flexDirection:"column",alignItems:msg.type==="human"?"flex-end":"flex-start",gap:2}}>
                  <div style={{background:msg.type==="human"?`${brand.corPrimaria}25`:dark?"#161b22":"#f1f5f9",border:`1px solid ${msg.type==="human"?brand.corPrimaria+"35":borderC}`,borderRadius:msg.type==="human"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:12,color:textC,maxWidth:"80%",lineHeight:1.5}}>{msg.content}</div>
                  <div style={{fontSize:9,color:subC}}>{msg.hora}</div>
                </div>)}
                <div ref={chatEndRef}/>
              </div>
              <div style={{padding:"10px 12px",borderTop:`1px solid ${borderC}`,display:"flex",gap:8}}>
                <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Escrever mensagem..." style={{flex:1,background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"8px 12px",color:textC,fontSize:12,outline:"none"}}/>
                <button onClick={sendMessage} disabled={sending} style={{background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:9,padding:"8px 12px",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:6,opacity:sending?.7:1,fontSize:12}}>{sending?<Spinner/>:<>{ICONS.send} Enviar</>}</button>
              </div>
            </>:<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:subC,gap:10}}><div style={{fontSize:36}}>💬</div><div style={{fontSize:13,fontWeight:600}}>Selecione um cliente</div></div>}
          </div>
          <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 15px",borderBottom:`1px solid ${borderC}`,fontSize:13,fontWeight:700,color:textC}}>Informações</div>
            {selected?<div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:14,padding:14,background:`${brand.corPrimaria}08`,borderRadius:12}}><Avatar name={selected.nomewpp} size={44}/><div style={{marginTop:10,fontWeight:700,fontSize:14,color:textC}}>{selected.nomewpp}</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <FieldCard label="Telefone" value={fmtPhone(selected.telefone)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
                <FieldCard label="Serviço" value={TIPO_SERVICO_LABEL[selected.tipo_servico]||"—"} color={TIPO_SERVICO_COLOR[selected.tipo_servico]} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
                <FieldCard label="Nicho" value={selected.nicho||"—"} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
                <FieldCard label="Status IA" value={selected.atendimento_ia==="pause"?"Pausada":"Ativa"} color={selected.atendimento_ia==="pause"?"#f59e0b":"#10b981"} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
                <FieldCard label="Cadastro" value={fmtDate(selected.created_at)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
              </div>
            </div>:<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:subC,fontSize:12}}>Nenhum selecionado</div>}
          </div>
        </div>}

        {!loading&&tab==="agenda"&&<AgendaTab dark={dark} cardBg={cardBg} borderC={borderC} textC={textC} mutedC={mutedC} subC={subC} inputBg={inputBg} brand={brand} toast={toast}/>}

        {!loading&&tab==="usuarios"&&isAdmin&&<div style={{maxWidth:620}}>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {["usuarios","plano"].map(sub=><button key={sub} onClick={()=>setUsuariosSubTab(sub)} style={{background:usuariosSubTab===sub?brand.corPrimaria:"transparent",color:usuariosSubTab===sub?"#fff":mutedC,border:`1px solid ${usuariosSubTab===sub?brand.corPrimaria:borderC}`,borderRadius:9,padding:"8px 14px",cursor:"pointer",fontWeight:700,fontSize:12,transition:"all .15s"}}>{sub==="usuarios"?"Usuários":"Plano"}</button>)}
          </div>
          {usuariosSubTab==="usuarios"&&<div>
            <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:20,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:textC,marginBottom:16}}>Novo Usuário</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <input placeholder="Nome completo *" value={newNome} onChange={e=>setNewNome(e.target.value)} style={{gridColumn:"1/-1",background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
                <input placeholder="Usuário *" value={newUsername} onChange={e=>setNewUsername(e.target.value)} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
                <input placeholder="Senha *" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/>
                <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{background:inputBg,border:`1px solid ${borderC}`,borderRadius:8,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}>
                  <option value="usuario">Usuário</option><option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={adicionarUsuario} disabled={usuariosLoading} style={{width:"100%",background:brand.corPrimaria,color:"#fff",border:"none",borderRadius:9,padding:10,marginTop:12,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:usuariosLoading?.7:1}}>
                {usuariosLoading?<><Spinner/>Salvando...</>:<>{ICONS.plus} Adicionar Usuário</>}
              </button>
            </div>
            <div style={{fontSize:11,color:mutedC,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>{usuarios.length} / {plano.maxUsuarios} usuários</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(usuarios.length>0?usuarios:[{username:"admin",nome:"Admin",role:"admin"}]).map(u=>(
                <div key={u.username} style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={u.nome} size={36}/><div><div style={{fontWeight:600,fontSize:13,color:textC}}>{u.nome}</div><div style={{fontSize:11,color:mutedC}}>@{u.username} · {u.role==="admin"?"Administrador":"Usuário"}</div></div></div>
                  {u.username===loggedUser?.username?<span style={{fontSize:10,color:brand.corPrimaria,fontWeight:700,background:`${brand.corPrimaria}15`,padding:"3px 8px",borderRadius:4}}>Você</span>:
                  <button onClick={()=>removerUsuario(u.username)} disabled={usuariosLoading} style={{background:"#ef444415",color:"#ef4444",border:"1px solid #ef444430",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{ICONS.trash} Remover</button>}
                </div>
              ))}
            </div>
          </div>}
          {usuariosSubTab==="plano"&&<div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <FieldCard label="Plano" value={plano.nome} color={brand.corPrimaria} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
              <FieldCard label="Status" value={plano.status} color={plano.status==="ativo"?"#10b981":"#ef4444"} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
              <FieldCard label="Valor" value={fmtCurrency(plano.preco)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
              <FieldCard label="Vencimento" value={fmtDate(plano.vencimento)} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
              <FieldCard label="Usuários disponíveis" value={`${plano.maxUsuarios} usuários`} textC={textC} mutedC={mutedC} borderC={borderC} cardBg={cardBg}/>
            </div>
          </div>}
        </div>}

        {!loading&&tab==="aparencia"&&isAdmin&&<div style={{maxWidth:540}}>
          <div style={{background:cardBg,border:`1px solid ${borderC}`,borderRadius:14,padding:24}}>
            <div style={{fontSize:14,fontWeight:800,color:textC,marginBottom:20}}>White Label — Aparência</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><label style={{fontSize:11,fontWeight:700,color:mutedC,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Nome</label><input value={brandDraft.nome} onChange={e=>setBrandDraft({...brandDraft,nome:e.target.value})} style={{width:"100%",background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"9px 12px",color:textC,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:mutedC,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Inicial</label><input value={brandDraft.inicial} onChange={e=>setBrandDraft({...brandDraft,inicial:e.target.value})} maxLength={1} style={{width:"100%",background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"9px 12px",color:textC,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,fontWeight:700,color:mutedC,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Subtítulo</label><input value={brandDraft.subtitulo} onChange={e=>setBrandDraft({...brandDraft,subtitulo:e.target.value})} style={{width:"100%",background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"9px 12px",color:textC,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,fontWeight:700,color:mutedC,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Cor Primária</label><div style={{display:"flex",gap:10}}><input type="color" value={brandDraft.corPrimaria} onChange={e=>setBrandDraft({...brandDraft,corPrimaria:e.target.value})} style={{width:46,height:42,border:`1px solid ${borderC}`,borderRadius:9,cursor:"pointer",padding:3}}/><input value={brandDraft.corPrimaria} onChange={e=>setBrandDraft({...brandDraft,corPrimaria:e.target.value})} style={{flex:1,background:inputBg,border:`1px solid ${borderC}`,borderRadius:9,padding:"9px 12px",color:textC,fontSize:13,outline:"none"}}/></div></div>
            </div>
            <div style={{marginTop:18,padding:14,background:`${brandDraft.corPrimaria}10`,border:`1px solid ${brandDraft.corPrimaria}30`,borderRadius:12}}>
              <div style={{fontSize:11,fontWeight:700,color:mutedC,textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Preview</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${brandDraft.corPrimaria},${brandDraft.corPrimaria}88)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800}}>{brandDraft.inicial}</div><div><div style={{fontWeight:800,fontSize:14,color:textC}}>{brandDraft.nome}</div><div style={{fontSize:10,color:mutedC}}>{brandDraft.subtitulo}</div></div></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={handleSaveBrand} disabled={brandLoading} style={{flex:1,background:brandDraft.corPrimaria,color:"#fff",border:"none",borderRadius:9,padding:11,cursor:"pointer",fontWeight:700,fontSize:13,opacity:brandLoading?.7:1}}>{brandLoading?"Salvando...":"Salvar Aparência"}</button>
              <button onClick={()=>setBrandDraft(BRAND_DEFAULT)} style={{flex:1,background:"transparent",color:mutedC,border:`1px solid ${borderC}`,borderRadius:9,padding:11,cursor:"pointer",fontWeight:600,fontSize:13}}>Restaurar Padrão</button>
            </div>
          </div>
        </div>}
      </div>
    </div>

    {drawerClient&&tab==="clientes"&&<ClientDrawer client={drawerClient} onClose={()=>setDrawerClient(null)} onToggleIA={c=>toggleIA(c)} onChangeServico={changeServico} brand={brand} dark={dark} cardBg={cardBg} borderC={borderC} textC={textC} mutedC={mutedC}/>}

    <div style={{position:"fixed",bottom:20,right:20,display:"flex",flexDirection:"column",gap:8,zIndex:9999}}>
      {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>setToasts(p=>p.filter(x=>x.id!==t.id))}/>)}
    </div>
  </div>;
}
