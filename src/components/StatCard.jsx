export default function StatCard({ title, value, accent = 'text-slate-800' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <div className={`mt-3 text-4xl font-black ${accent}`}>{value}</div>
    </div>
  )
}