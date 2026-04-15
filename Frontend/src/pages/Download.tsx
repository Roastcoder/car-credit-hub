import React from 'react';
import { Download, Monitor, Smartphone, Globe, ArrowLeft, Shield, Zap, Bell, CheckCircle2, Apple } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function DownloadPage() {
  const platforms = [
    {
      name: 'Windows',
      icon: <Monitor size={32} className="text-white" />,
      file: '/MeharFinance_Setup.exe',
      type: '.exe',
      description: 'Native Windows 10/11 Suite'
    },
    {
      name: 'macOS',
      icon: <Apple size={32} className="text-white" />,
      file: '/MeharFinance_Mac.dmg',
      type: '.dmg',
      description: 'Optimized for Mac Desktop'
    },
    {
      name: 'Android',
      icon: <Smartphone size={32} className="text-white" />,
      file: '/mehar-finance.apk',
      type: '.apk',
      description: 'Mobile field application'
    }
  ];

  const features = [
    { name: 'Pure Performance', description: 'The desktop app runs faster than the web version by offloading main processing to your hardware.', icon: <Zap className="text-yellow-500" /> },
    { name: 'Native Notifications', description: 'Get instant alerts for payment approvals and new loan applications directly on your OS.', icon: <Bell className="text-blue-500" /> },
    { name: 'Advanced Security', description: 'Enhanced data encryption and secure biometric integration for local machines.', icon: <Shield className="text-red-500" /> },
    { name: 'Offline Mode', description: 'View your recent ledger and application data even when you have intermittent connectivity.', icon: <Globe className="text-indigo-500" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-border bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/login" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors font-medium text-sm group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Login
          </Link>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-6 w-auto" />
            <span className="text-sm font-bold text-slate-800 dark:text-white">Mehar Finance</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-6 py-12 text-center relative overflow-hidden bg-white-600 text-black shadow-inner">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_100%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-4 inline-block">
            <img src={logo} alt="Mehar Finance" className="h-16 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
            Download Mehar Finance
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Platform Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {platforms.map((p) => (
            <div key={p.name} className="bg-card p-6 rounded-3xl border border-border shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                {React.cloneElement(p.icon as React.ReactElement, { size: 120, className: "text-blue-500" })}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{p.type}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {p.description}
              </p>
              <a
                href={p.file}
                download
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm"
              >
                <Download size={18} /> Get {p.name} App
              </a>
            </div>
          ))}
        </div>

        {/* Features Section - More Compact */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.name} className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-border">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-3">
                {f.icon}
              </div>
              <h4 className="text-sm font-bold mb-1">{f.name}</h4>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-border">
        <p className="text-sm text-muted-foreground font-medium">
          © {new Date().getFullYear()} Mehar Finance Advisory. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
