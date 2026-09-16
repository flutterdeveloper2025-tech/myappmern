import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const API=(import.meta.env.VITE_API_URL||'http://192.168.0.189:3000/api').replace(/\/$/, '');

async function api(path,options={}){
 const token=localStorage.getItem('token');
 const headers={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})};
 const r=await fetch(API+path,{...options,headers:{...headers,...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||'Request failed');
 return data;
}

function Login({onLogin}){
 const [mode,setMode]=useState('login');
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');
  try{
   const path=mode==='login'?'/auth/login':'/auth/register';
   const body=mode==='login'?{email,password}:{name,email,password};
   const d=await api(path,{method:'POST',body:JSON.stringify(body)});
   localStorage.setItem('token',d.token);onLogin(d.user);
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <main className="center"><form className="card auth" onSubmit={submit}>
  <div className="logo">🛠️</div>
  <h1>IT Service Desk</h1>
  <p>{mode==='login'?'Sign in to manage support tickets.':'Create your support account.'}</p>
  {mode==='signup'&&<input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required minLength="2"/>}
  <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
  <input type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required minLength="8"/>
  <button disabled={busy}>{busy?(mode==='login'?'Signing in...':'Creating account...'):(mode==='login'?'Sign in':'Create Account')}</button>
  {error&&<div className="error">{error}</div>}
  <button type="button" className="ghost switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>
   {mode==='login'?"Don't have an account? Create Account":"Already have an account? Sign in"}
  </button>
 </form></main>
}
function Dashboard({user,onLogout}){
 const [tickets,setTickets]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[show,setShow]=useState(false);
 async function load(){setLoading(true);setError('');try{setTickets(await api('/tickets'))}catch(e){setError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const stats={open:tickets.filter(t=>t.status==='open').length,inProgress:tickets.filter(t=>t.status==='in_progress').length,resolved:tickets.filter(t=>t.status==='resolved').length,critical:tickets.filter(t=>t.priority==='critical').length};
 return <div className="app"><header><div><b>IT Service Desk</b><small>Support Management</small></div><div className="user"><span>{user?.name||'User'}</span><button className="ghost" onClick={onLogout}>Logout</button></div></header>
 <main className="content"><div className="hero"><div><h2>Dashboard 👋</h2><p>Track and manage your support requests.</p></div><button onClick={()=>setShow(true)}>+ New Ticket</button></div>
 <section className="stats"><Stat n={stats.open} t="Open Tickets"/><Stat n={stats.inProgress} t="In Progress"/><Stat n={stats.resolved} t="Resolved"/><Stat n={stats.critical} t="Critical"/></section>
 <section className="card"><div className="sectionTitle"><h3>Recent Tickets</h3><button className="ghost" onClick={load}>↻ Refresh</button></div>
 {loading?<div className="empty">Loading...</div>:error?<div className="error">{error}</div>:tickets.length===0?<div className="empty">No tickets yet. Create your first ticket.</div>:<div className="tickets">{tickets.map(t=><Ticket key={t._id} t={t}/>)}</div>}</section>
 </main>{show&&<NewTicket close={()=>setShow(false)} refresh={load}/>}</div>
}

function Stat({n,t}){return <div className="card stat"><strong>{n}</strong><span>{t}</span></div>}
function Ticket({t}){return <article className="ticket"><div><b>{t.title}</b><small>{t.category||'General'} • {new Date(t.createdAt).toLocaleString()}</small></div><span className="pill">{t.priority}</span><span className="pill">{t.status.replace('_',' ')}</span></article>}
function NewTicket({close,refresh}){
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[priority,setPriority]=useState('medium'),[error,setError]=useState('');
 async function submit(e){e.preventDefault();setError('');try{await api('/tickets',{method:'POST',body:JSON.stringify({title,description,priority})});close();refresh()}catch(e){setError(e.message)}}
 return <div className="overlay"><form className="card modal" onSubmit={submit}><h2>New Ticket</h2><input placeholder="Issue title" value={title} onChange={e=>setTitle(e.target.value)} required/><textarea placeholder="Describe the issue..." value={description} onChange={e=>setDescription(e.target.value)} required/><select value={priority} onChange={e=>setPriority(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select>{error&&<div className="error">{error}</div>}<div className="actions"><button type="button" className="ghost" onClick={close}>Cancel</button><button>Create Ticket</button></div></form></div>
}

function App(){
 const [user,setUser]=useState(null);
 function logout(){localStorage.removeItem('token');setUser(null)}
 return user?<Dashboard user={user} onLogout={logout}/>:<Login onLogin={setUser}/>;
}
createRoot(document.getElementById('root')).render(<App/>);
