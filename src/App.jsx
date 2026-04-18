import { useState, useEffect } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import { api, auth } from './lib/api.js';
import RecipeLab from './RecipeLab.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // On mount, if we have a cached password, verify it works
  useEffect(() => {
    (async () => {
      const pw = auth.get();
      if (!pw) {
        setChecking(false);
        return;
      }
      try {
        await api.listRecipes();
        setAuthed(true);
      } catch {
        auth.clear();
      }
      setChecking(false);
    })();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const ok = await api.login(password);
      if (ok) {
        setAuthed(true);
      } else {
        setErr('Wrong password.');
      }
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-600" />
      </div>
    );
  }

  if (authed) {
    return <RecipeLab onLogout={() => { auth.clear(); setAuthed(false); setPassword(''); }} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Focaccia Co</h1>
            <p className="text-xs text-stone-500 -mt-0.5">Recipe Lab</p>
          </div>
        </div>
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
        />
        {err && <p className="text-xs text-red-700 mt-2">{err}</p>}
        <button
          type="submit"
          disabled={!password || busy}
          className="mt-4 w-full bg-red-800 hover:bg-red-900 disabled:bg-stone-300 text-white text-sm font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter'}
        </button>
      </form>
    </div>
  );
}
