import { useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { apiFetch } from '../api/client.js'

export async function optimizeImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/webp') return file
  const bitmap = await createImageBitmap(file)
  const maxDimension = 1800
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }) : file
}

export function ProfileImageEditor({ imageUrl, token, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', await optimizeImage(file))
      const response = await apiFetch('/api/admin/profile-image', { method: 'POST', headers: { 'X-Admin-Token': token }, body: form })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Image upload failed')
      onChanged(body.profile_image_url)
    } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try {
      const response = await apiFetch('/api/admin/profile-image', { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Image deletion failed')
      onChanged(null)
    } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  return <div className="profile-image-editor"><div className="eyebrow">Home profile image</div>{imageUrl ? <img src={imageUrl} alt="Current profile" /> : <div className="profile-image-empty">No profile image</div>}<div className="profile-image-actions"><label className="button button-dark">{busy ? 'Working…' : imageUrl ? 'Replace image' : 'Upload image'}<input type="file" accept="image/*" onChange={upload} disabled={busy} hidden /></label>{imageUrl && <button className="button admin-secondary" type="button" onClick={remove} disabled={busy}><Trash2 size={15} /> Delete image</button>}</div><p className="admin-muted">JPEG, PNG, WEBP, or another image format up to 5 MB.</p></div>
}

export function ProjectImageEditor({ projectId, imageUrl, imageFile, setImageFile, token, onChanged, error }) {
  const remove = async () => {
    if (!projectId) return
    try {
      const response = await apiFetch(`/api/admin/projects/${projectId}/image`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Project image deletion failed')
      onChanged(null)
    } catch (reason) { error(reason.message) }
  }
  return <div className="project-image-editor"><div className="eyebrow">Project image</div>{imageUrl ? <img src={imageUrl} alt="Current project" /> : <div className="profile-image-empty">No project image</div>}<label className="button button-dark">{imageFile ? 'Image selected' : imageUrl ? 'Replace image' : 'Choose image'}<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} hidden /></label>{imageUrl && <button className="button admin-secondary" type="button" onClick={remove}>Delete image</button>}<p className="admin-muted">Optional image, uploaded when the project is saved. Maximum 5 MB.</p></div>
}

export function CompanyLogoEditor({ experienceId, logoUrl, selectedFile, onFileChanged, onLogoChanged, token, onError }) {
  const remove = async () => {
    onFileChanged(null)
    if (!experienceId || !logoUrl) {
      onLogoChanged('')
      return
    }
    try {
      const response = await apiFetch(`/api/admin/experiences/${experienceId}/company-logo`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || 'Company logo could not be deleted')
      onLogoChanged('')
    } catch (reason) { onError(reason.message) }
  }
  return <div className="company-logo-editor"><div className="eyebrow">Company logo</div>{logoUrl && <img src={logoUrl} alt="Current company logo" />}{selectedFile && <span className="admin-muted">{selectedFile.name} selected</span>}<label className="button button-dark">{selectedFile ? 'Choose another logo' : logoUrl ? 'Replace logo' : 'Choose logo'}<input type="file" accept="image/*" onChange={(event) => onFileChanged(event.target.files?.[0] || null)} hidden /></label>{(logoUrl || selectedFile) && <button className="button admin-secondary" type="button" onClick={remove}>Delete logo</button>}<p className="admin-muted">Optional image, uploaded when the experience is saved. Maximum 5 MB.</p></div>
}

export function ExperienceImageEditor({ experienceId, imageUrls, onImagesChanged, selectedFiles, onFilesChanged, token, onError }) {
  const remaining = 4 - imageUrls.length - selectedFiles.length
  const remove = async (index) => {
    if (!experienceId) return
    try {
      const response = await apiFetch(`/api/admin/experiences/${experienceId}/images/${index}`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Experience image deletion failed')
      onImagesChanged(imageUrls.filter((_, imageIndex) => imageIndex !== index))
    } catch (reason) { onError(reason.message) }
  }
  const selectFiles = (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length > remaining) {
      onError(`You can add ${remaining} more image${remaining === 1 ? '' : 's'}; each experience can have up to 4.`)
      return
    }
    onFilesChanged([...selectedFiles, ...files])
  }
  return <div className="experience-image-editor"><div className="eyebrow">Experience images ({imageUrls.length + selectedFiles.length}/4)</div><div className="experience-admin-gallery">{imageUrls.map((url, index) => <div className="experience-admin-image" key={url}><img src={url} alt={`Experience image ${index + 1}`} /><button type="button" aria-label={`Delete image ${index + 1}`} onClick={() => remove(index)}><Trash2 size={14} /></button></div>)}{selectedFiles.map((file, index) => <div className="experience-admin-image selected" key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" aria-label={`Remove selected image ${file.name}`} onClick={() => onFilesChanged(selectedFiles.filter((_, fileIndex) => fileIndex !== index))}><X size={14} /></button></div>)}</div>{remaining > 0 && <label className="button button-dark"><ImagePlus size={15} /> Choose images<input type="file" accept="image/*" multiple onChange={selectFiles} hidden /></label>}<p className="admin-muted">Optional. Up to 4 images per experience, 5 MB each. New images upload when you save the experience.</p></div>
}
