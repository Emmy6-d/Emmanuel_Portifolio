import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Mail } from 'lucide-react'
import { request } from './api/client.js'
import { Header } from './components/Header.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ProjectsPage } from './pages/ProjectsPage.jsx'
import { SkillsPage } from './pages/SkillsPage.jsx'
import { ExperiencePage } from './pages/ExperiencePage.jsx'
import { ExperienceDetailPage } from './pages/ExperienceDetailPage.jsx'
import { ContactPage } from './pages/ContactPage.jsx'
import { AdminPage } from './admin/AdminPage.jsx'

export default function App() {
  const [page, setPage] = useState(window.location.hash.slice(1) || 'home')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setLoading(true)
    setError('')
    request('/portfolio')
      .then(setData)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    const change = () => setPage(window.location.hash.slice(1) || 'home')
    window.addEventListener('hashchange', change)
    void Promise.resolve().then(load)
    return () => window.removeEventListener('hashchange', change)
  }, [load])
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
  return <><Header page={activePage} navigate={navigate} /><main>{page === 'home' && <HomePage data={data} navigate={navigate} />}{page === 'projects' && <ProjectsPage data={data} />}{page === 'skills' && <SkillsPage data={data} />}{page === 'experience' && <ExperiencePage data={data} navigate={navigate} />}{selectedExperienceId && <ExperienceDetailPage experience={selectedExperience} navigate={navigate} />}{page === 'evidence' && <ContactPage data={data} />}</main><footer className="footer shell"><span>© 2026 {data.name}</span><span>Let's Build reliable systems <Mail size={14} /></span></footer></>
}
