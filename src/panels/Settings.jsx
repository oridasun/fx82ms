import React from 'react';
import { translations } from '../i18n.js';

export default function Settings({ lang, setLang, onClearHistory, history, onLoadHistory }) {
  const T = translations[lang] || translations.es;
  return (
    <div className="panel-content settings">
      <section>
        <h3>{T.language}</h3>
        <div className="lang-toggle">
          <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>{T.spanish}</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>{T.english}</button>
        </div>
      </section>

      <section>
        <h3>{T.history}</h3>
        {history.length === 0 && <p className="muted">—</p>}
        <ol className="history-list">
          {history.slice(0, 20).map((h, i) => (
            <li key={i}>
              <button className="history-item" onClick={() => onLoadHistory(h)} title={h.formula}>
                <span className="hist-formula">{h.formula}</span>
                <span className="hist-result">= {h.result}</span>
              </button>
            </li>
          ))}
        </ol>
        <button className="danger" onClick={onClearHistory} disabled={history.length === 0}>
          {T.clearHistory}
        </button>
      </section>
    </div>
  );
}
