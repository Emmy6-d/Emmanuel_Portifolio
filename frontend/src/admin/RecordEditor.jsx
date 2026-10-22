import { useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { apiFetch, request } from '../api/client.js'
import { resources } from './config.js'
import { CompanyLogoEditor, ExperienceImageEditor, ProjectImageEditor } from './ImageEditors.jsx'
import { Panel } from './ListEditor.jsx'

export function RecordEditor({ resource, items, token, reload, message, error }) {
  const fields = resources[resource].fields
  const empty = Object.fromEntries(fields.map((field) => [field, '']))
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [experienceImages, setExperienceImages] = useState([])
  const [currentExperienceImages, setCurrentExperienceImages] = useState([])
  const [companyLogoFile, setCompanyLogoFile] = useState(null)
  const [currentCompanyLogo, setCurrentCompanyLogo] = useState('')

  const save = async (event) => {
    event.preventDefault()
    try {
      const body = { ...form }
      if (body.tags !== undefined) body.tags = body.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      const saved = await request(`/admin/${resource}${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) }, token)
      if (saved.id) setEditing(saved.id)
      if (resource === 'experiences' && saved.image_urls) setCurrentExperienceImages(saved.image_urls)
      if (resource === 'projects' && imageFile && saved.id) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const response = await apiFetch(`/api/admin/projects/${saved.id}/image`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || 'Project image upload failed')
      }
      if (resource === 'experiences' && experienceImages.length && saved.id) {
        const formData = new FormData()
        experienceImages.forEach((file) => formData.append('files', file))
        const response = await apiFetch(`/api/admin/experiences/${saved.id}/images`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || 'Experience image upload failed')
      }
      if (resource === 'experiences' && companyLogoFile && saved.id) {
        const formData = new FormData()
        formData.append('file', companyLogoFile)
        const response = await apiFetch(`/api/admin/experiences/${saved.id}/company-logo`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || 'Company logo upload failed')
        setCurrentCompanyLogo(result.company_logo_url || '')
      }
      setForm(empty)
      setEditing(null)
      setImageFile(null)
      setExperienceImages([])
      setCurrentExperienceImages([])
      setCompanyLogoFile(null)
      setCurrentCompanyLogo('')
      message('Record saved.')
      reload()
    } catch (reason) { error(reason.message) }
  }

  const edit = (item) => {
    setEditing(item.id)
    setImageFile(null)
    setExperienceImages([])
    setCurrentExperienceImages(item.image_urls || [])
    setCompanyLogoFile(null)
    setCurrentCompanyLogo(item.company_logo_url || '')
    setForm({ ...Object.fromEntries(fields.map((field) => [field, field === 'tags' ? (item.tags || []).join(', ') : item[field] || ''])), image_url: item.image_url || '' })
  }
  const remove = async (id) => {
    if (!confirm('Delete this record?')) return
    try { await request(`/admin/${resource}/${id}`, { method: 'DELETE' }, token); message('Record deleted.'); reload() } catch (reason) { error(reason.message) }
  }
  return <Panel title={resources[resource].label}><form className="admin-form" onSubmit={save}>{fields.map((field) => <label key={field}>{field}{['description', 'summary'].includes(field) ? <textarea rows={field === 'description' ? 5 : 3} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /> : <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}</label>)}{resource === 'projects' && <ProjectImageEditor projectId={editing} imageUrl={form.image_url} imageFile={imageFile} setImageFile={setImageFile} token={token} onChanged={(url) => setForm({ ...form, image_url: url })} error={error} />}{resource === 'experiences' && <><CompanyLogoEditor experienceId={editing} logoUrl={currentCompanyLogo} selectedFile={companyLogoFile} onFileChanged={setCompanyLogoFile} onLogoChanged={setCurrentCompanyLogo} token={token} onError={error} /><ExperienceImageEditor experienceId={editing} imageUrls={currentExperienceImages} onImagesChanged={setCurrentExperienceImages} selectedFiles={experienceImages} onFilesChanged={setExperienceImages} token={token} onError={error} /></>}<button className="button button-dark"><Save size={15} /> {editing ? 'Update' : 'Add'} record</button></form><div className="admin-list">{items.map((item) => <div className="admin-list-row" key={item.id}><div><strong>{item.title || item.role || item.qualification}</strong><span>{item.company || item.institution || item.type}</span></div><div className="admin-row-actions"><button onClick={() => edit(item)}><Save size={14} /> Edit</button><button onClick={() => remove(item.id)}><Trash2 size={14} /> Delete</button></div></div>)}</div></Panel>
}
