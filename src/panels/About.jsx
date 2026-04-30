import React from 'react';
import { translations } from '../i18n.js';

export default function About({ lang }) {
  const T = translations[lang] || translations.es;
  return (
    <div className="panel-content about">
      <div className="about-logo">ICIENCIA</div>
      <p className="about-version">{T.version}: 1.0.0 — FX-82MS</p>
      <p>{T.aboutText}</p>
      <p className="muted">{T.aboutBrand}</p>
    </div>
  );
}
