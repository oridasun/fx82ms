import React, { useEffect, useRef, useState } from 'react';
import { KEYS, TOP_CONTROLS } from './keys.js';

export default function Keypad({ onKey, shift = false, alpha = false, lang = 'es' }) {
  const [pressed, setPressed] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const press = (id) => {
    setPressed(id);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPressed(null), 120);
    onKey(id);
  };

  const renderKey = (k) => {
    // Localización de la etiqueta del botón decimal.
    const mainLabel = (k.id === 'DOT' && lang === 'es') ? ',' : k.main;
    return (
      <button
        key={k.id}
        type="button"
        style={k.span ? { gridColumn: `span ${k.span}` } : undefined}
        className={`key ${k.className} ${k.top ? 'has-top' : ''} ${pressed === k.id ? 'pressed' : ''}`}
        onClick={() => press(k.id)}
        aria-label={k.main || k.id}
      >
        {k.top && <span className="key-top">{k.top}</span>}
        <span className="key-main">{mainLabel}</span>
      </button>
    );
  };

  const dpad = TOP_CONTROLS.dpad;

  const keypadCls = `keypad${shift ? ' shift-active' : ''}${alpha ? ' alpha-active' : ''}`;

  return (
    <div className={keypadCls} role="group" aria-label="Teclado de la calculadora">
      <div className="top-controls">
        <div className="top-side top-left">
          {TOP_CONTROLS.left.map(renderKey)}
        </div>

        <div className="dpad" role="group" aria-label="REPLAY">
          <button
            type="button"
            className={`dpad-key dpad-up ${pressed === dpad.up.id ? 'pressed' : ''}`}
            onClick={() => press(dpad.up.id)}
            aria-label="Up"
          >
            {dpad.up.label}
          </button>
          <button
            type="button"
            className={`dpad-key dpad-left ${pressed === dpad.left.id ? 'pressed' : ''}`}
            onClick={() => press(dpad.left.id)}
            aria-label="Left"
          >
            {dpad.left.label}
          </button>
          <div className="dpad-center" aria-hidden="true">
            <span>{dpad.center.label}</span>
          </div>
          <button
            type="button"
            className={`dpad-key dpad-right ${pressed === dpad.right.id ? 'pressed' : ''}`}
            onClick={() => press(dpad.right.id)}
            aria-label="Right"
          >
            {dpad.right.label}
          </button>
          <button
            type="button"
            className={`dpad-key dpad-down ${pressed === dpad.down.id ? 'pressed' : ''}`}
            onClick={() => press(dpad.down.id)}
            aria-label="Down"
          >
            {dpad.down.label}
          </button>
        </div>

        <div className="top-side top-right">
          {TOP_CONTROLS.right.map(renderKey)}
        </div>
      </div>

      <div className="keypad-rows">
        <div className="keypad-rows-fns">
          <div className="keypad-row">{KEYS[0].map(renderKey)}</div>
        </div>
        <div className="keypad-rows-main">
          {KEYS.slice(1).map((row, rIdx) => (
            <div className="keypad-row" key={rIdx}>
              {row.map(renderKey)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
