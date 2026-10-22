import { useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { request } from '../api/client.js'

export function ListEditor({ resource, items, token, reload, message, error, contacts = false }) {
  const [value, setValue] = useState('')
  if (resource === 'skills' && !contacts) return <SkillEditor items={items} token={token} reload={reload} message={message} error={error} />
  const add = async (event) => { event.preventDefault(); try { await request(`/admin/${resource}`, { method: 'POST', body: JSON.stringify({ value }) }, token); setValue(''); message('Item added.'); reload() } catch (reason) { error(reason.message) } }
  const remove = async (id) => { if (!confirm('Delete this item?')) return; try { await request(`/admin/${resource}/${id}`, { method: 'DELETE' }, token); message('Item deleted.'); reload() } catch (reason) { error(reason.message) } }
  return <Panel title={resource[0].toUpperCase() + resource.slice(1)}>{!contacts && <form className="admin-inline-form" onSubmit={add}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="New item" required /><button className="button button-dark">Add</button></form>}<div className={contacts ? 'admin-messages' : 'admin-chip-list'}>{items.map((item) => contacts ? <article className="admin-message" key={item.id}><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><p>{item.message}</p><button onClick={() => remove(item.id)}><Trash2 size={14} /> Delete</button></article> : <span key={item.id}>{item.value}<button onClick={() => remove(item.id)}><X size={13} /></button></span>)}</div></Panel>
}

export function SkillEditor({ items, token, reload, message, error }) {
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('Other')
  const add = async (event) => { event.preventDefault(); try { await request('/admin/skills', { method: 'POST', body: JSON.stringify({ value, category }) }, token); setValue(''); message('Skill added.'); reload() } catch (reason) { error(reason.message) } }
  const remove = async (id) => { if (!confirm('Delete this skill?')) return; try { await request(`/admin/skills/${id}`, { method: 'DELETE' }, token); message('Skill deleted.'); reload() } catch (reason) { error(reason.message) } }
  return <Panel title="Skills"><form className="admin-inline-form" onSubmit={add}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Skill name" required /><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Skill group / frame" required /><button className="button button-dark">Add</button></form><div className="admin-chip-list">{items.map((item) => <span key={item.id}>{item.value} <small>({item.category || 'Other'})</small><button onClick={() => remove(item.id)}><X size={13} /></button></span>)}</div></Panel>
}

export function Panel({ title, children }) { return <div className="admin-panel"><div className="eyebrow">Content management</div><h2>{title}</h2>{children}</div> }
