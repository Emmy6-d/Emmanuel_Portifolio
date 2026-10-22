import { useCallback, useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { request } from '../api/client.js'
import { resources } from './config.js'
import { AdminLogin } from './AdminLogin.jsx'
import { ProfileEditor } from './ProfileEditor.jsx'
import { RecordEditor } from './RecordEditor.jsx'
import { ListEditor } from './ListEditor.jsx'

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('portfolio_admin_token') || '')
  const [login, setLogin] = useState('')
  const [section, setSection] = useState('experiences')
  const [data, setData] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async (active) => {
    try {
      const profile = await request('/portfolio')
      const result = { profile }
      for (const key of [...Object.keys(resources), 'skills', 'certifications', 'languages', 'contacts']) {
        result[key] = await request(`/admin/${key}`, {}, active)
      }
      setData(result)
      localStorage.setItem('portfolio_admin_token', active)
      setToken(active)
      setError('')
    } catch (reason) {
      setError(reason.message)
      localStorage.removeItem('portfolio_admin_token')
    }
  }, [])

  useEffect(() => {
    if (token) void Promise.resolve().then(() => load(token))
  }, [token, load])

  if (!token) {
    return <AdminLogin
      value={login}
      setValue={setLogin}
      error={error}
      submit={(event) => { event.preventDefault(); void load(login) }}
    />
  }

  const logout = () => {
    localStorage.removeItem('portfolio_admin_token')
    setToken('')
  }

  return <section className="admin-page shell">
    <div className="admin-header"><div><div className="eyebrow">Admin workspace</div><h1>Manage<br /><em>portfolio content.</em></h1></div><button className="admin-logout" onClick={logout}><LogOut size={15} /> Log out</button></div>
    {error && <div className="admin-alert error">{error}</div>}
    {message && <div className="admin-alert success">{message}</div>}
    <div className="admin-layout">
      <aside className="admin-sidebar">{['profile', ...Object.keys(resources), 'skills', 'certifications', 'languages', 'contacts'].map((key) => <button className={section === key ? 'active' : ''} key={key} onClick={() => setSection(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}</aside>
      <div className="admin-content">
        {section === 'profile' && <ProfileEditor data={data.profile} token={token} onSaved={(value) => { setData({ ...data, profile: { ...data.profile, ...value } }); setMessage('Profile saved.') }} onError={setError} />}
        {resources[section] && <RecordEditor resource={section} items={data[section] || []} token={token} reload={() => load(token)} message={setMessage} error={setError} />}
        {['skills', 'certifications', 'languages'].includes(section) && <ListEditor resource={section} items={data[section] || []} token={token} reload={() => load(token)} message={setMessage} error={setError} />}
        {section === 'contacts' && <ListEditor resource="contacts" items={data.contacts || []} token={token} reload={() => load(token)} message={setMessage} error={setError} contacts />}
      </div>
    </div>
  </section>
}
