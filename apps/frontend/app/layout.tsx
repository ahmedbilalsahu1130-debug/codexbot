import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const links = ['dashboard', 'symbols', 'signals', 'backtesting', 'settings', 'simulator'];
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl gap-4 p-4 text-sm">
              {links.map((l) => <Link className="rounded px-2 py-1 hover:bg-white/10" key={l} href={`/${l}`}>{l.toUpperCase()}</Link>)}
            </nav>
          </header>
          <main className="mx-auto max-w-7xl p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
