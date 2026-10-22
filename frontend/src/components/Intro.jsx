export function Intro({ number, title, children }) {
  const labels = { '01': 'Featured work', '02': 'Skills & expertise', '03': 'Career journey', '04': 'Let’s connect' }
  return <section className="page-intro shell"><div className="eyebrow">{number} / {labels[number] || title}</div><h1>{title}</h1>{children && <p>{children}</p>}</section>
}
