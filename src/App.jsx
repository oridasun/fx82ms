import React, { useEffect, useState } from 'react';
import Display from './calculator/Display.jsx';
import Keypad from './calculator/Keypad.jsx';
import Manual from './panels/Manual.jsx';
import About from './panels/About.jsx';
import Settings from './panels/Settings.jsx';
import { useCalculator } from './calculator/useCalculator.js';
import { PHYSICAL_KEY_MAP } from './calculator/keys.js';
import { translations } from './i18n.js';

const LANG_KEY = 'iciencia.lang';

export default function App() {
  const calc = useCalculator();
  const [panel, setPanel] = useState(null); // 'manual' | 'about' | 'settings' | null
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'es');
  const [installPrompt, setInstallPrompt] = useState(null);

  const T = translations[lang] || translations.es;

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Atajos físicos
  useEffect(() => {
    const handler = (e) => {
      if (panel) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const id = PHYSICAL_KEY_MAP[e.key];
      if (id) {
        e.preventDefault();
        calc.dispatchKey(id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [calc, panel]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="app">
      <div className="calc-shell" role="application" aria-label="ICIENCIA FX-82MS">
        <header className="calc-header">
          <div className="brand">
            <span className="brand-name">ICIENCIA</span>
            <span className="brand-model">FX-82MS</span>
          </div>
          <div className="header-actions">
            {installPrompt && (
              <button className="chip" onClick={triggerInstall} title={T.install}>{T.install}</button>
            )}
            <button className="chip" onClick={() => setPanel('manual')}>{T.manual}</button>
            <button className="chip" onClick={() => setPanel('settings')}>{T.settings}</button>
            <button className="chip" onClick={() => setPanel('about')}>{T.about}</button>
          </div>
        </header>

        <Display state={calc.state} sdStats={calc.sdStats} lang={lang} />
        <div className="brand-stripe">
          <span className="stripe-logo">ICIENCIA</span>
          <span className="stripe-model">SCIENTIFIC CALCULATOR fx-82MS · S-V.P.A.M.</span>
        </div>
        <Keypad onKey={calc.dispatchKey} shift={calc.state.shift} alpha={calc.state.alpha} lang={lang} />
      </div>

      {panel && (
        <aside className="panel" role="dialog" aria-modal="true">
          <div className="panel-header">
            <h2>
              {panel === 'manual' && T.manual}
              {panel === 'about' && T.about}
              {panel === 'settings' && T.settings}
            </h2>
            <button className="close" onClick={() => setPanel(null)} aria-label={T.close}>✕</button>
          </div>
          {panel === 'manual'   && <Manual lang={lang} />}
          {panel === 'about'    && <About  lang={lang} />}
          {panel === 'settings' && (
            <Settings
              lang={lang}
              setLang={setLang}
              history={calc.history}
              onClearHistory={calc.clearHistory}
              onLoadHistory={(h) => { calc.loadFromHistory(h); setPanel(null); }}
            />
          )}
        </aside>
      )}
      {panel && <div className="panel-backdrop" onClick={() => setPanel(null)} />}
    </div>
  );
}
