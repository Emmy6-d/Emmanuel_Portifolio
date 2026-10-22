import { ArrowUpRight } from 'lucide-react'
import { Intro } from '../components/Intro.jsx'

export function ExperiencePage({ data, navigate }) {
  return <><Intro number="03" title="Experience and education." /><section className="experience-page shell"><div className="timeline">{data.experience.map((item, index) => {
    const summary = item.summary?.trim() || (item.description?.trim().length <= 240 ? item.description.trim() : '')
    return <a className="timeline-item timeline-link" href={`#experience/${item.id ?? `entry-${index}`}`} key={item.id || `${item.company}-${item.role}`} onClick={(event) => { event.preventDefault(); navigate(`experience/${item.id ?? `entry-${index}`}`) }}><div className="timeline-dot" /><div className="project-type">{item.period}</div><h2>{item.role}</h2><h3 className="experience-company">{item.company_logo_url && <img className="experience-company-logo" src={item.company_logo_url} alt="" />}{item.company}</h3>{summary && <p>{summary}</p>}<div className="tags">{(item.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div><span className="experience-open">Read experience <ArrowUpRight size={15} /></span></a>
  })}</div><div className="education-panel"><div className="eyebrow">Education</div>{data.education.map((item) => <div className="education-item" key={item.id || item.qualification}><strong>{item.qualification}</strong><span>{item.institution}</span><span>{item.period} · {item.detail}</span></div>)}<div className="eyebrow credential-label">Languages</div><div className="language-list">{data.languages.map((item) => <span key={item}>{item}</span>)}</div></div></section></>
}
