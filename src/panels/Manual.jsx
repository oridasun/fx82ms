import React from 'react';
import { translations } from '../i18n.js';

export default function Manual({ lang }) {
  const m = (translations[lang] || translations.es).manualSections;
  const sections = ['basics', 'svpam', 'shiftKeys', 'modes', 'display', 'percent', 'sciNotation', 'dms', 'quadratic', 'memory', 'stats', 'decimal', 'keyboard'];
  return (
    <div className="panel-content manual">
      {sections.map((s) => (
        <section key={s}>
          <h3>{m[s]}</h3>
          <p>{m[`${s}Body`]}</p>
        </section>
      ))}
    </div>
  );
}
