import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
