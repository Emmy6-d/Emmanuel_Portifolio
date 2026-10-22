import { useEffect, useRef, useState } from 'react'
import { faGithub, faInstagram, faLinkedin, faTiktok, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { request } from '../api/client.js'
import { BrandIcon } from '../components/BrandIcon.jsx'
import { Intro } from '../components/Intro.jsx'
const whatsappNumber = '250789711424'

export function ContactPage({ data }) {
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
