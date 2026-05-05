import React, { useEffect, useRef } from 'react';

function renderFormulaWithCursor(formula, cursor, blinking) {
  if (formula.length === 0) {
    return <span className="cursor blink">{blinking ? '_' : ' '}</span>;
  }
  const before = formula.slice(0, cursor);
  const at = formula.slice(cursor, cursor + 1);
  const after = formula.slice(cursor + 1);
  return (
    <>
      <span>{before}</span>
      <span className="cursor cursor-block">{at || ' '}</span>
      <span>{after}</span>
    </>
  );
}

export default function Display({ state, sdStats, lang }) {
  const { formula, cursor, resultText, shift, alpha, angleMode, displayMode, M, mode, hyp, error, pendingMenu } = state;
  const formulaRef = useRef(null);

  // Auto-scroll horizontal: mantener el cursor a la vista cuando la
  // fórmula es más larga que la pantalla.
  useEffect(() => {
    const root = formulaRef.current;
    if (!root) return;
    const cursorEl = root.querySelector('.cursor');
    if (!cursorEl) return;
    const cRect = cursorEl.getBoundingClientRect();
    const rRect = root.getBoundingClientRect();
    if (cRect.right > rRect.right - 4) {
      root.scrollLeft += cRect.right - rRect.right + 24;
    } else if (cRect.left < rRect.left + 4) {
      root.scrollLeft -= rRect.left - cRect.left + 24;
    }
  }, [formula, cursor]);

  // Localización del separador decimal (solo visualización; la fórmula interna usa '.').
  const decimalChar = lang === 'es' ? ',' : '.';
  const localize = (s) => decimalChar === '.' ? s : (s ?? '').toString().replace(/\./g, ',');

  const formulaText = localize(formula
    .replace(/sqrt/g, '√')
    .replace(/cbrt/g, '∛'));

  // Menús que reemplazan completamente las dos líneas (SETUP).
  const menuPrompt = pendingMenu === 'displayMode' ? { line1: 'Fix    Sci   Norm', line2: ' 1      2      3' }
                   : pendingMenu === 'fix'         ? { line1: 'Fix 0~9?', line2: '' }
                   : pendingMenu === 'sci'         ? { line1: 'Sci 0~9?', line2: '' }
                   : null;
  // Banner superior cuando se está pidiendo a/b/c — sigue mostrando la fórmula.
  const quadBanner = pendingMenu === 'quadA' ? 'a x²+b x+c=0   a?'
                   : pendingMenu === 'quadB' ? 'a x²+b x+c=0   b?'
                   : pendingMenu === 'quadC' ? 'a x²+b x+c=0   c?'
                   : null;

  return (
    <div className="display" role="region" aria-label="Calculator display">
      <div className="display-indicators">
        <span className={shift ? 'on' : ''}>S</span>
        <span className={alpha ? 'on' : ''}>A</span>
        <span className={M !== 0 ? 'on' : ''}>M</span>
        <span className={'mode-flag'}>{mode === 'SD' ? 'SD' : ''}</span>
        <span className="spacer" />
        <span className={hyp ? 'on' : ''}>HYP</span>
        <span className={'on'}>{angleMode === 'DEG' ? 'D' : angleMode === 'RAD' ? 'R' : 'G'}</span>
        <span className={displayMode !== 'NORM' ? 'on' : ''}>
          {displayMode === 'FIX' ? 'FIX' : displayMode === 'SCI' ? 'SCI' : ''}
        </span>
      </div>

      {menuPrompt ? (
        <>
          <div className="display-line formula menu-prompt" aria-live="polite">{menuPrompt.line1}</div>
          <div className="display-line result menu-prompt" aria-live="polite">{menuPrompt.line2}</div>
        </>
      ) : (
        <>
          {quadBanner && (
            <div className="quad-banner" aria-live="polite">{quadBanner}</div>
          )}
          <div className="display-line formula" aria-live="polite" ref={formulaRef}>
            {renderFormulaWithCursor(formulaText, cursor, true)}
          </div>
          <div className={`display-line result ${error ? 'error' : ''}`} aria-live="polite">
            {localize(resultText)}
          </div>
        </>
      )}

      {mode === 'SD' && (
        <div className="sd-bar" title="Modo SD">
          <span>n={sdStats.n}</span>
          <span>x̄={sdStats.mean.toPrecision(6)}</span>
          <span>σn={sdStats.sigmaN.toPrecision(6)}</span>
        </div>
      )}
    </div>
  );
}
