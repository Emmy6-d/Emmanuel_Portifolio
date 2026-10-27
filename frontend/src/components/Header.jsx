import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react'

const pages = [['home', 'Home'], ['projects', 'Projects'], ['skills', 'Skills'], ['experience', 'Experience'], ['evidence', 'Contact']]

export function Header({ page, navigate }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return <header className="nav-wrap"><nav className="nav shell" aria-label="Main navigation"><button className="brand brand-name" onClick={() => navigate('home')}><span>EMMANUEL</span><small>DUSHIMIMANA</small></button><div className={`nav-links ${open ? 'open' : ''}`}>{pages.map(([key, label]) => <button className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} key={key} onClick={() => { navigate(key); setOpen(false) }}>{label}</button>)}</div><div className="nav-actions"><button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button className="nav-cta" onClick={() => { navigate('evidence'); setOpen(false) }}>Let’s talk <ArrowUpRight size={16} /></button></div><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button></nav></header>
}
