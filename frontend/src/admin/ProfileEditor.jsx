import { useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { request } from '../api/client.js'
import { ProfileImageEditor } from './ImageEditors.jsx'
import { Panel } from './ListEditor.jsx'

export function ProfileEditor({ data, token, onSaved, onError }) { const [form, setForm] = useState(data || {}); const set = (key, value) => setForm({ ...form, [key]: value }); const save = async (event) => { event.preventDefault(); try { const payload = { ...form, email: form.email, socials: typeof form.socials === 'string' ? JSON.parse(form.socials) : form.socials, highlights: typeof form.highlights === 'string' ? JSON.parse(form.highlights) : form.highlights, growth_areas: Array.isArray(form.growth_areas) ? form.growth_areas.filter(Boolean) : String(form.growth_areas || '').split('\\n').filter(Boolean), opportunity_tracks: String(form.opportunity_tracks || '').split('\n').filter(Boolean) }; const result = await request('/admin/profile', { method: 'PUT', body: JSON.stringify(payload) }, token); onSaved(result) } catch (reason) { onError(reason.message) } }; return <Panel title="Profile"><ProfileImageEditor imageUrl={form.profile_image_url} token={token} onChanged={(url) => set("profile_image_url", url)} onError={onError} /><form className="admin-form" onSubmit={save}>{['name', 'role', 'specialty', 'location', 'phone', 'email', 'availability', 'intro', 'bio', 'positioning'].map((key) => <label key={key}>{key}{['intro', 'bio', 'positioning'].includes(key) ? <textarea rows="3" value={form[key] || ''} onChange={(event) => set(key, event.target.value)} /> : <input value={form[key] || ''} onChange={(event) => set(key, event.target.value)} required />}</label>)}<GrowthAreasEditor items={Array.isArray(form.growth_areas) ? form.growth_areas : []} onChanged={(items) => set('growth_areas', items)} /><label>Opportunity tracks, one per line<textarea value={Array.isArray(form.opportunity_tracks) ? form.opportunity_tracks.join('\n') : form.opportunity_tracks || ''} onChange={(event) => set('opportunity_tracks', event.target.value)} /></label><button className="button button-dark"><Save size={15} /> Save profile</button></form></Panel> }

export function GrowthAreasEditor({ items, onChanged }) {
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(null)
  const save = (event) => {
    event.preventDefault()
    const next = value.trim()
    if (!next) return
    const updated = [...items]
    if (editing === null) updated.push(next)
    else updated[editing] = next
    onChanged(updated)
    setValue('')
    setEditing(null)
  }
  const edit = (index) => { setEditing(index); setValue(items[index]) }
  const remove = (index) => { onChanged(items.filter((_, itemIndex) => itemIndex !== index)); if (editing === index) { setEditing(null); setValue('') } }
  return <div className="growth-admin-editor"><div className="eyebrow">Growth areas</div><form className="admin-inline-form" onSubmit={save}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Add growth area" required /><button className="button button-dark">{editing === null ? 'Add' : 'Update'}</button>{editing !== null && <button className="button admin-secondary" type="button" onClick={() => { setEditing(null); setValue('') }}>Cancel</button>}</form><div className="growth-admin-list">{items.map((item, index) => <div className="growth-admin-row" key={`${item}-${index}`}><span>{item}</span><div className="admin-row-actions"><button type="button" onClick={() => edit(index)}><Save size={14} /> Edit</button><button type="button" onClick={() => remove(index)}><Trash2 size={14} /> Delete</button></div></div>)}</div></div> }
