import React, { useEffect, useRef, useState } from 'react'
import { faGithub, faInstagram, faLinkedin, faTiktok, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { ArrowUpRight, ImagePlus, LogOut, Mail, MapPin, Menu, Phone, Save, Trash2, X } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const pages = [['home', 'Home'], ['projects', 'Projects'], ['skills', 'Skills'], ['experience', 'Experience'], ['evidence', 'Contact']]
const whatsappNumber = '250789711424'
const resources = {
  experiences: { label: 'Experiences', fields: ['company', 'role', 'type', 'period', 'summary', 'description', 'tags'] },
  projects: { label: 'Projects', fields: ['title', 'type', 'description', 'tags', 'link', 'caseStudy', 'accent'] },
  education: { label: 'Education', fields: ['qualification', 'institution', 'period', 'detail'] },
}

async function request(path, options = {}, token) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Admin-Token': token } : {}), ...(options.headers || {}) } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : Array.isArray(body.detail) ? body.detail.map((issue) => issue && typeof issue.msg === 'string' ? issue.msg : JSON.stringify(issue)).join('; ') : ''
    throw new Error(detail || `Request failed with status ${response.status}`)
  }
  if (!body || (path === '/portfolio' && (!Array.isArray(body.projects) || !Array.isArray(body.experience)))) throw new Error('The portfolio API did not return valid data')
  return body
}

function App() {
  const [page, setPage] = useState(window.location.hash.slice(1) || 'home')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = () => { setLoading(true); setError(''); request('/portfolio').then(setData).catch((reason) => setError(reason.message)).finally(() => setLoading(false)) }
  useEffect(() => { load(); const change = () => setPage(window.location.hash.slice(1) || 'home'); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change) }, [])
  const navigate = (target) => { window.location.hash = target; setPage(target); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const activePage = page.split('/')[0]
  const selectedExperienceId = activePage === 'experience' && page.includes('/') ? page.slice(page.indexOf('/') + 1) : null
  const fallbackExperienceIndex = selectedExperienceId?.match(/^entry-(\d+)$/)
  const selectedExperience = selectedExperienceId && data
    ? data.experience.find((item) => String(item.id) === selectedExperienceId) || (fallbackExperienceIndex ? data.experience[Number(fallbackExperienceIndex[1])] : null)
    : null
  if (page === 'admin') return <AdminPage />
  if (loading) return <><Header page={activePage} navigate={navigate} /><main className="shell state-page"><div className="eyebrow">Getting things ready</div><h1>Loading<br /><em>the portfolio.</em></h1></main></>
  if (error || !data) return <><Header page={activePage} navigate={navigate} /><main className="shell state-page"><div className="eyebrow">A brief pause</div><h1>This page is<br /><em>temporarily unavailable.</em></h1><p>{error || 'Please try again in a moment.'}</p><button className="button button-dark" onClick={load}>Try again <ArrowUpRight size={16} /></button></main></>
  return <><Header page={activePage} navigate={navigate} /><main>{page === 'home' && <HomePage data={data} navigate={navigate} />}{page === 'projects' && <ProjectsPage data={data} />}{page === 'skills' && <SkillsPage data={data} />}{page === 'experience' && <ExperiencePage data={data} navigate={navigate} />}{selectedExperienceId && <ExperienceDetailPage experience={selectedExperience} navigate={navigate} />}{page === 'evidence' && <EvidencePage data={data} />}</main><footer className="footer shell"><span>© 2026 {data.name}</span><span>Let's Build reliable systems <Mail size={14} /></span></footer></>
}

function Header({ page, navigate }) {
  const [open, setOpen] = useState(false)
  return <header className="nav-wrap"><nav className="nav shell" aria-label="Main navigation"><button className="brand brand-name" onClick={() => navigate('home')}><span>EMMANUEL</span><small>DUSHIMIMANA</small></button><div className={`nav-links ${open ? 'open' : ''}`}>{pages.map(([key, label]) => <button className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} key={key} onClick={() => { navigate(key); setOpen(false) }}>{label}</button>)}</div><button className="nav-cta" onClick={() => { navigate('evidence'); setOpen(false) }}>Let’s talk <ArrowUpRight size={16} /></button><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button></nav></header>
}
function BrandIcon({ icon, size = 18 }) {
  const [width, height, , , pathData] = icon.icon
  const paths = Array.isArray(pathData) ? pathData : [pathData]
  return <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${width} ${height}`} fill="currentColor">{paths.map((path, index) => <path d={path} key={index} />)}</svg>
}
function Intro({ number, title, children }) { const labels = { '01': 'Featured work', '02': 'Skills & expertise', '03': 'Career journey', '04': 'Let’s connect' }; return <section className="page-intro shell"><div className="eyebrow">{number} / {labels[number] || title}</div><h1>{title}</h1>{children && <p>{children}</p>}</section> }
function HomePage({ data, navigate }) { return <><section className="hero shell"><div className="hero-copy"><div className="eyebrow"><span className="status-dot" /> {data.availability}</div><h1 className="name-heading">{data.name}</h1><h2 className="hero-title"><span className="hero-role">{data.role}</span><em className="hero-specialty">{data.specialty}</em></h2><p className="hero-text">{data.intro}</p><div className="hero-actions"><button className="button button-dark" onClick={() => navigate('projects')}>Explore my work <ArrowUpRight size={17} /></button><button className="text-link" onClick={() => navigate('evidence')}>Contact me</button></div></div><div className="hero-art">{data.profile_image_url && <img className="home-profile-image" src={data.profile_image_url} alt={`Portrait of ${data.name}`} />}<div className="orb orb-one" /><div className="orb orb-two" /><div className="grid-lines" /><div className="code-card"><span>focus</span> = <b>Embedded systems</b>;<br /><span>impact</span> = <b>Reliable IoT</b>;</div><div className="hero-identity"><strong>{data.name}</strong><small>{data.location}</small></div></div></section><section className="home-overview shell"><div><div className="eyebrow">Profile</div><h2>Hardware grounded.<br /><em>Future focused.</em></h2></div><div><p className="large-copy">{data.bio}</p><p className="muted-copy">{data.positioning}</p><button className="button button-dark" onClick={() => navigate('experience')}>See my journey <ArrowUpRight size={16} /></button></div></section></> }
function ProjectsPage({ data }) { return <><Intro number="01" title="Featured projects." /><section className="section shell"><div className="project-grid">{data.projects.map((project, index) => <article className={`project-card ${project.accent || 'blue'}`} key={project.id || project.title}><div className="project-top"><span>{String(index + 1).padStart(2, '0')}</span>{project.link && <a className="project-details-button" href={project.link} target="_blank" rel="noreferrer">See details <ArrowUpRight size={15} /></a>}</div><div className={project.image_url ? 'project-visual project-visual-image' : 'project-visual'}>{project.image_url ? <img className="project-image" src={project.image_url} alt={project.title} /> : <div className="visual-window"><div className="visual-lines" /></div>}</div><div className="project-meta"><div><div className="project-type">{project.type}</div><h3>{project.title}</h3></div><p>{project.description}</p></div><div className="tags">{(project.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</div></section></> }
function SkillsPage({ data }) { return <><Intro number="02" title="Technical skills." /><section className="skills-page shell"><div className="skill-groups">{(data.skill_groups || []).map((group) => <article className="skill-group" key={group.name}><div className="project-type">Skill group</div><h2>{group.name}</h2><div className="skill-list">{group.skills.map((skill) => <span key={skill.id || skill.value}>{skill.value}</span>)}</div></article>)}</div><div className="growth-panel"><div className="eyebrow">Growth areas</div><div className="growth-list">{data.growth_areas.map((area) => <span key={area}>{area}</span>)}</div></div></section></> }
function ExperiencePage({ data, navigate }) {
  return <><Intro number="03" title="Experience and education." /><section className="experience-page shell"><div className="timeline">{data.experience.map((item, index) => {
    const summary = item.summary?.trim() || (item.description?.trim().length <= 240 ? item.description.trim() : '')
    return <a className="timeline-item timeline-link" href={`#experience/${item.id ?? `entry-${index}`}`} key={item.id || `${item.company}-${item.role}`} onClick={(event) => { event.preventDefault(); navigate(`experience/${item.id ?? `entry-${index}`}`) }}><div className="timeline-dot" /><div className="project-type">{item.period}</div><h2>{item.role}</h2><h3 className="experience-company">{item.company_logo_url && <img className="experience-company-logo" src={item.company_logo_url} alt="" />}{item.company}</h3>{summary && <p>{summary}</p>}<div className="tags">{(item.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div><span className="experience-open">Read experience <ArrowUpRight size={15} /></span></a>
  })}</div><div className="education-panel"><div className="eyebrow">Education</div>{data.education.map((item) => <div className="education-item" key={item.id || item.qualification}><strong>{item.qualification}</strong><span>{item.institution}</span><span>{item.period} · {item.detail}</span></div>)}<div className="eyebrow credential-label">Languages</div><div className="language-list">{data.languages.map((item) => <span key={item}>{item}</span>)}</div></div></section></>
}

function ExperienceDetailPage({ experience, navigate }) {
  if (!experience) return <section className="experience-detail shell"><div className="eyebrow">Experience not found</div><h1>This experience<br /><em>is unavailable.</em></h1><button className="back-link" onClick={() => navigate('experience')}>← Back to experience</button></section>
  return <article className="experience-detail shell"><button className="back-link" onClick={() => navigate('experience')}>← All experience</button><header className="experience-detail-heading"><div className="eyebrow">Professional experience</div><h1>{experience.role}</h1><h2 className="experience-detail-company">{experience.company_logo_url && <img className="experience-company-logo" src={experience.company_logo_url} alt="" />}{experience.company}</h2><div className="experience-detail-meta"><span>{experience.period}</span>{experience.type && <span>{experience.type}</span>}</div></header><section className="experience-description"><div className="eyebrow">About this role</div><p>{experience.description}</p></section>{experience.image_urls?.length > 0 && <section className="experience-gallery" aria-label={`${experience.role} images`}><div className="eyebrow">In pictures</div><div className="experience-gallery-grid">{experience.image_urls.map((url, index) => <figure key={url}><img src={url} alt={`${experience.role} at ${experience.company} — image ${index + 1}`} loading="lazy" /><figcaption>{experience.company} · {index + 1}</figcaption></figure>)}</div></section>}{experience.tags?.length > 0 && <div className="tags experience-detail-tags">{experience.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}<button className="back-link experience-detail-back" onClick={() => navigate('experience')}>← Back to all experience</button></article>
}
function EvidencePage({ data }) {
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const feedbackTimeout = useRef(null)

  useEffect(() => () => clearTimeout(feedbackTimeout.current), [])

  const showFeedback = (type, text) => {
    clearTimeout(feedbackTimeout.current)
    setFeedback({ type, text })
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 10000)
  }

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const isValid = form.checkValidity()
    const validationMessage = form.querySelector(':invalid')?.validationMessage
    const values = Object.fromEntries(new FormData(form))
    form.reset()
    clearTimeout(feedbackTimeout.current)
    setFeedback(null)

    if (!isValid) {
      showFeedback('error', `Sorry, your message couldn't be sent: ${validationMessage || 'Please complete all required fields.'}`)
      return
    }
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await request('/contact', { method: 'POST', body: JSON.stringify(values) })
      showFeedback('success', 'Thank you for contacting me. I have received your message and will reply shortly.')
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : String(reason)
      showFeedback('error', `Sorry, your message couldn't be sent. ${detail}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <><Intro number="04" title="Let's build something useful together." /><section className="contact-page shell"><div className="contact-layout"><aside className="contact-info"><div className="eyebrow"><span className="status-dot" /> {data.availability}</div><h2>Have a good<br /><em>idea?</em></h2><p className="contact-lead">I’m open to thoughtful collaborations, engineering opportunities, and projects that turn complex problems into dependable solutions.</p><div className="contact-details"><a className="contact-action contact-email" href={`mailto:${data.email}`}><Mail size={20} /><span>Email me</span></a><a className="contact-action contact-call" href={`tel:${data.phone.replace(/[^+\\d]/g, '')}`}><Phone size={20} /><span>Call me</span></a><a className="contact-action contact-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><BrandIcon icon={faWhatsapp} size={20} /><span>Whatsapp me</span></a><div><MapPin size={17} /><span><small>Based in</small>{data.location}</span></div></div><div className="contact-opportunities"><div className="eyebrow">Open to</div><div className="contact-tags">{(data.opportunity_tracks || []).map((item) => <span key={item}>{item}</span>)}</div></div><section className="contact-social-section" aria-labelledby="contact-social-heading"><div className="eyebrow" id="contact-social-heading">Socials</div><div className="socials contact-socials"><a href={data.socials.github} aria-label="GitHub profile" target="_blank" rel="noreferrer"><BrandIcon icon={faGithub} /> GitHub <ArrowUpRight size={13} /></a><a href={data.socials.linkedin} aria-label="LinkedIn profile" target="_blank" rel="noreferrer"><BrandIcon icon={faLinkedin} /> LinkedIn <ArrowUpRight size={13} /></a><a href="https://x.com/Emmy__6d" aria-label="X profile" target="_blank" rel="noreferrer"><BrandIcon icon={faXTwitter} /> X <ArrowUpRight size={13} /></a><a href="https://www.instagram.com/emmy_6d/" aria-label="Instagram profile" target="_blank" rel="noreferrer"><BrandIcon icon={faInstagram} /> Instagram <ArrowUpRight size={13} /></a><a href="https://www.tiktok.com/@emmy.6d" aria-label="TikTok profile" target="_blank" rel="noreferrer"><BrandIcon icon={faTiktok} /> TikTok <ArrowUpRight size={13} /></a></div></section></aside><div className="contact-card"><div className="contact-card-head"><div><div className="eyebrow">Start a conversation</div><h3>Tell me about your project.</h3></div><span className="contact-index">04</span></div><p className="contact-card-copy">Share a few details and I’ll get back to you as soon as possible.</p><form onSubmit={submit} noValidate><label>Name<input name="name" placeholder="Your name" required /></label><label>Email<input name="email" type="email" placeholder="you@example.com" required /></label><label>Message<textarea name="message" rows="5" placeholder="What would you like to build?" required /></label><button className="button button-dark" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : <>Send message <ArrowUpRight size={17} /></>}</button>{feedback && <p className={`contact-form-feedback contact-form-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'} aria-live="polite">{feedback.text}</p>}</form></div></div><div className="contact-proof"><div><div className="eyebrow">Credentials</div><strong>Evidence of consistent learning and delivery.</strong></div><ul className="cert-list">{data.certifications.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div></section></>
}

function AdminPage() { const [token, setToken] = useState(() => localStorage.getItem('portfolio_admin_token') || ''); const [login, setLogin] = useState(''); const [section, setSection] = useState('experiences'); const [data, setData] = useState({}); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const load = async (active = token) => { try { const profile = await request('/portfolio'); const result = { profile }; for (const key of [...Object.keys(resources), 'skills', 'certifications', 'languages', 'contacts']) result[key] = await request(`/admin/${key}`, {}, active); setData(result); localStorage.setItem('portfolio_admin_token', active); setToken(active); setError('') } catch (reason) { setError(reason.message); localStorage.removeItem('portfolio_admin_token') } }; useEffect(() => { if (token) load(token) }, []); if (!token) return <AdminLogin value={login} setValue={setLogin} error={error} submit={(event) => { event.preventDefault(); load(login) }} />; const logout = () => { localStorage.removeItem('portfolio_admin_token'); setToken('') }; return <section className="admin-page shell"><div className="admin-header"><div><div className="eyebrow">Admin workspace</div><h1>Manage<br /><em>portfolio content.</em></h1></div><button className="admin-logout" onClick={logout}><LogOut size={15} /> Log out</button></div>{error && <div className="admin-alert error">{error}</div>}{message && <div className="admin-alert success">{message}</div>}<div className="admin-layout"><aside className="admin-sidebar">{['profile', ...Object.keys(resources), 'skills', 'certifications', 'languages', 'contacts'].map((key) => <button className={section === key ? 'active' : ''} key={key} onClick={() => setSection(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}</aside><div className="admin-content">{section === 'profile' && <ProfileEditor data={data.profile} token={token} onSaved={(value) => { setData({ ...data, profile: { ...data.profile, ...value } }); setMessage('Profile saved.') }} onError={setError} />}{resources[section] && <RecordEditor resource={section} items={data[section] || []} token={token} reload={() => load()} message={setMessage} error={setError} />}{['skills', 'certifications', 'languages'].includes(section) && <ListEditor resource={section} items={data[section] || []} token={token} reload={() => load()} message={setMessage} error={setError} />}{section === 'contacts' && <ListEditor resource="contacts" items={data.contacts || []} token={token} reload={() => load()} message={setMessage} error={setError} contacts />}</div></div></section> }
function AdminLogin({ value, setValue, error, submit }) { return <section className="admin-login shell"><div className="eyebrow">Private area</div><h1>Admin<br /><em>sign in.</em></h1><p>Use the value configured as <code>PORTFOLIO_ADMIN_TOKEN</code> on the backend.</p><form onSubmit={submit}><label>Admin token<input type="password" value={value} onChange={(event) => setValue(event.target.value)} required autoFocus /></label><button className="button button-dark">Open dashboard <ArrowUpRight size={16} /></button></form>{error && <div className="admin-alert error">{error}</div>}</section> }
function ProfileEditor({ data, token, onSaved, onError }) { const [form, setForm] = useState(data || {}); const set = (key, value) => setForm({ ...form, [key]: value }); const save = async (event) => { event.preventDefault(); try { const payload = { ...form, email: form.email, socials: typeof form.socials === 'string' ? JSON.parse(form.socials) : form.socials, highlights: typeof form.highlights === 'string' ? JSON.parse(form.highlights) : form.highlights, growth_areas: Array.isArray(form.growth_areas) ? form.growth_areas.filter(Boolean) : String(form.growth_areas || '').split('\\n').filter(Boolean), opportunity_tracks: String(form.opportunity_tracks || '').split('\n').filter(Boolean) }; const result = await request('/admin/profile', { method: 'PUT', body: JSON.stringify(payload) }, token); onSaved(result) } catch (reason) { onError(reason.message) } }; return <Panel title="Profile"><ProfileImageEditor imageUrl={form.profile_image_url} token={token} onChanged={(url) => set("profile_image_url", url)} onError={onError} /><form className="admin-form" onSubmit={save}>{['name', 'role', 'specialty', 'location', 'phone', 'email', 'availability', 'intro', 'bio', 'positioning'].map((key) => <label key={key}>{key}{['intro', 'bio', 'positioning'].includes(key) ? <textarea rows="3" value={form[key] || ''} onChange={(event) => set(key, event.target.value)} /> : <input value={form[key] || ''} onChange={(event) => set(key, event.target.value)} required />}</label>)}<GrowthAreasEditor items={Array.isArray(form.growth_areas) ? form.growth_areas : []} onChanged={(items) => set('growth_areas', items)} /><label>Opportunity tracks, one per line<textarea value={Array.isArray(form.opportunity_tracks) ? form.opportunity_tracks.join('\n') : form.opportunity_tracks || ''} onChange={(event) => set('opportunity_tracks', event.target.value)} /></label><button className="button button-dark"><Save size={15} /> Save profile</button></form></Panel> }
function RecordEditor({ resource, items, token, reload, message, error }) {
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
        const response = await fetch(`/api/admin/projects/${saved.id}/image`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || 'Project image upload failed')
      }
      if (resource === 'experiences' && experienceImages.length && saved.id) {
        const formData = new FormData()
        experienceImages.forEach((file) => formData.append('files', file))
        const response = await fetch(`/api/admin/experiences/${saved.id}/images`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || 'Experience image upload failed')
      }
      if (resource === 'experiences' && companyLogoFile && saved.id) {
        const formData = new FormData()
        formData.append('file', companyLogoFile)
        const response = await fetch(`/api/admin/experiences/${saved.id}/company-logo`, { method: 'POST', headers: { 'X-Admin-Token': token }, body: formData })
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
function ListEditor({ resource, items, token, reload, message, error, contacts = false }) {
  const [value, setValue] = useState('')
  if (resource === 'skills' && !contacts) return <SkillEditor items={items} token={token} reload={reload} message={message} error={error} />
  const add = async (event) => { event.preventDefault(); try { await request(`/admin/${resource}`, { method: 'POST', body: JSON.stringify({ value }) }, token); setValue(''); message('Item added.'); reload() } catch (reason) { error(reason.message) } }
  const remove = async (id) => { if (!confirm('Delete this item?')) return; try { await request(`/admin/${resource}/${id}`, { method: 'DELETE' }, token); message('Item deleted.'); reload() } catch (reason) { error(reason.message) } }
  return <Panel title={resource[0].toUpperCase() + resource.slice(1)}>{!contacts && <form className="admin-inline-form" onSubmit={add}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="New item" required /><button className="button button-dark">Add</button></form>}<div className={contacts ? 'admin-messages' : 'admin-chip-list'}>{items.map((item) => contacts ? <article className="admin-message" key={item.id}><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><p>{item.message}</p><button onClick={() => remove(item.id)}><Trash2 size={14} /> Delete</button></article> : <span key={item.id}>{item.value}<button onClick={() => remove(item.id)}><X size={13} /></button></span>)}</div></Panel>
}
function SkillEditor({ items, token, reload, message, error }) {
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('Other')
  const add = async (event) => { event.preventDefault(); try { await request('/admin/skills', { method: 'POST', body: JSON.stringify({ value, category }) }, token); setValue(''); message('Skill added.'); reload() } catch (reason) { error(reason.message) } }
  const remove = async (id) => { if (!confirm('Delete this skill?')) return; try { await request(`/admin/skills/${id}`, { method: 'DELETE' }, token); message('Skill deleted.'); reload() } catch (reason) { error(reason.message) } }
  return <Panel title="Skills"><form className="admin-inline-form" onSubmit={add}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Skill name" required /><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Skill group / frame" required /><button className="button button-dark">Add</button></form><div className="admin-chip-list">{items.map((item) => <span key={item.id}>{item.value} <small>({item.category || 'Other'})</small><button onClick={() => remove(item.id)}><X size={13} /></button></span>)}</div></Panel>
}
function GrowthAreasEditor({ items, onChanged }) {
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
function Panel({ title, children }) { return <div className="admin-panel"><div className="eyebrow">Content management</div><h2>{title}</h2>{children}</div> }

createRoot(document.getElementById('root')).render(<App />)

function ProfileImageEditor({ imageUrl, token, onChanged, onError }) {
  const [busy, setBusy] = useState(false)
  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/admin/profile-image', { method: 'POST', headers: { 'X-Admin-Token': token }, body: form })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Image upload failed')
      onChanged(body.profile_image_url)
    } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/admin/profile-image', { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Image deletion failed')
      onChanged(null)
    } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  return <div className="profile-image-editor"><div className="eyebrow">Home profile image</div>{imageUrl ? <img src={imageUrl} alt="Current profile" /> : <div className="profile-image-empty">No profile image</div>}<div className="profile-image-actions"><label className="button button-dark">{busy ? 'Working…' : imageUrl ? 'Replace image' : 'Upload image'}<input type="file" accept="image/*" onChange={upload} disabled={busy} hidden /></label>{imageUrl && <button className="button admin-secondary" type="button" onClick={remove} disabled={busy}><Trash2 size={15} /> Delete image</button>}</div><p className="admin-muted">JPEG, PNG, WEBP, or another image format up to 5 MB.</p></div>
}

function ProjectImageEditor({ projectId, imageUrl, imageFile, setImageFile, token, onChanged, error }) {
  const remove = async () => {
    if (!projectId) return
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/image`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.detail || 'Project image deletion failed')
      onChanged(null)
    } catch (reason) { error(reason.message) }
  }
  return <div className="project-image-editor"><div className="eyebrow">Project image</div>{imageUrl ? <img src={imageUrl} alt="Current project" /> : <div className="profile-image-empty">No project image</div>}<label className="button button-dark">{imageFile ? 'Image selected' : imageUrl ? 'Replace image' : 'Choose image'}<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} hidden /></label>{imageUrl && <button className="button admin-secondary" type="button" onClick={remove}>Delete image</button>}<p className="admin-muted">Optional image, uploaded when the project is saved. Maximum 5 MB.</p></div>
}

function CompanyLogoEditor({ experienceId, logoUrl, selectedFile, onFileChanged, onLogoChanged, token, onError }) {
  const remove = async () => {
    onFileChanged(null)
    if (!experienceId || !logoUrl) {
      onLogoChanged('')
      return
    }
    try {
      const response = await fetch(`/api/admin/experiences/${experienceId}/company-logo`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || 'Company logo could not be deleted')
      onLogoChanged('')
    } catch (reason) { onError(reason.message) }
  }
  return <div className="company-logo-editor"><div className="eyebrow">Company logo</div>{logoUrl && <img src={logoUrl} alt="Current company logo" />}{selectedFile && <span className="admin-muted">{selectedFile.name} selected</span>}<label className="button button-dark">{selectedFile ? 'Choose another logo' : logoUrl ? 'Replace logo' : 'Choose logo'}<input type="file" accept="image/*" onChange={(event) => onFileChanged(event.target.files?.[0] || null)} hidden /></label>{(logoUrl || selectedFile) && <button className="button admin-secondary" type="button" onClick={remove}>Delete logo</button>}<p className="admin-muted">Optional image, uploaded when the experience is saved. Maximum 5 MB.</p></div>
}

function ExperienceImageEditor({ experienceId, imageUrls, onImagesChanged, selectedFiles, onFilesChanged, token, onError }) {
  const remaining = 4 - imageUrls.length - selectedFiles.length
  const remove = async (index) => {
    if (!experienceId) return
    try {
      const response = await fetch(`/api/admin/experiences/${experienceId}/images/${index}`, { method: 'DELETE', headers: { 'X-Admin-Token': token } })
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
