import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { evaluate, formatNumber, formatEng, autoCloseParens, toDMS, solveQuadratic } from './engine.js';

const HISTORY_KEY = 'iciencia.history.v1';
const STATE_KEY   = 'iciencia.state.v1';

const initialState = {
  formula: '',
  cursor: 0,
  result: null,
  resultText: '0.',
  shift: false,
  alpha: false,
  hyp: false,
  angleMode: 'DEG',           // DEG | RAD | GRAD
  displayMode: 'NORM',        // NORM | FIX-n | SCI-n
  fixDigits: null,
  sciDigits: null,
  ans: 0,
  M: 0,
  mode: 'COMP',               // COMP | SD
  sdData: [],                 // datos numéricos en modo SD
  historyIndex: -1,
  error: null,
  showResult: false,          // si la última acción fue =
  engOffset: null,            // null = sin conversión eng; 0 = base eng; ±3 = ajustado
  pendingMenu: null,          // null | 'displayMode' | 'fix' | 'sci' | 'quadA' | 'quadB' | 'quadC'
  quadCoeffs: null,           // { a, b, c? } durante captura cuadrática
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ans: parsed.ans ?? 0,
      M: parsed.M ?? 0,
      angleMode: parsed.angleMode ?? 'DEG',
      displayMode: parsed.displayMode ?? 'NORM',
      fixDigits: parsed.fixDigits ?? null,
      sciDigits: parsed.sciDigits ?? null,
      mode: parsed.mode ?? 'COMP',
      sdData: parsed.sdData ?? [],
    };
  } catch { return null; }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function persist(state, history) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      ans: state.ans, M: state.M, angleMode: state.angleMode,
      displayMode: state.displayMode, fixDigits: state.fixDigits,
      sciDigits: state.sciDigits, mode: state.mode, sdData: state.sdData
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch { /* ignore quota */ }
}

function insertText(state, text) {
  // Tras un resultado: si lo siguiente es un operador binario, encadenamos
  // con Ans (fx-82MS). Si es número/función, empezamos fórmula nueva.
  if (state.showResult) {
    const isBinaryOp = /^[+\-−×÷*/^]/.test(text);
    if (isBinaryOp) {
      const seed = 'Ans';
      return {
        ...state,
        formula: seed + text,
        cursor: seed.length + text.length,
        showResult: false,
        error: null,
        historyIndex: -1
      };
    }
    return {
      ...state,
      formula: text,
      cursor: text.length,
      showResult: false,
      error: null,
      historyIndex: -1
    };
  }
  const before = state.formula.slice(0, state.cursor);
  const after  = state.formula.slice(state.cursor);
  return {
    ...state,
    formula: before + text + after,
    cursor: state.cursor + text.length,
    showResult: false,
    error: null,
    historyIndex: -1
  };
}

function clearShifts(state) {
  return { ...state, shift: false, alpha: false };
}

function evalCurrent(state) {
  try {
    const balanced = autoCloseParens(state.formula);
    const sdStats = computeSDStats(state.sdData || []);
    const value = evaluate(balanced, {
      angleMode: state.angleMode, ans: state.ans, M: state.M,
      sdStats
    });
    return {
      ...state,
      formula: balanced,
      cursor: balanced.length,
      result: value,
      resultText: formatNumber(value, { fix: state.fixDigits, sci: state.sciDigits }),
      ans: typeof value === 'number' ? value : state.ans,
      showResult: true,
      engOffset: null,
      error: null
    };
  } catch (e) {
    return { ...state, error: 'Syntax ERROR', resultText: 'Syntax ERROR', showResult: true };
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'KEY': return handleKey(state, action.key, action.history, action.dispatchHistory);
    case 'INSERT': return insertText(state, action.text);
    case 'SET_CURSOR': return { ...state, cursor: Math.max(0, Math.min(action.value, state.formula.length)) };
    case 'CLEAR_HISTORY_RESULT': return { ...state, historyIndex: -1 };
    case 'LOAD_FROM_HISTORY': {
      const item = action.item;
      return { ...state, formula: item.formula, cursor: item.formula.length, showResult: false, error: null };
    }
    case 'RESET': return { ...initialState, ans: state.ans, M: state.M, angleMode: state.angleMode };
    default: return state;
  }
}

function withInsert(state, text) { return clearShifts(insertText(state, text)); }

function handleKey(state, key, history, pushHistory) {
  // Manejo de SHIFT/ALPHA: si está activo, cambiar comportamiento de la tecla.
  const shifted = state.shift;
  const s = state;

  // Modificadores
  if (key === 'SHIFT') return { ...s, shift: !s.shift, alpha: false };
  if (key === 'ALPHA') return { ...s, alpha: !s.alpha, shift: false };
  if (key === 'HYP') return { ...s, hyp: !s.hyp };
  if (key === 'ON')  return clearShifts({ ...initialState, ans: s.ans, M: s.M });

  // Menú SETUP (SHIFT+MODE) — captura previa al resto del handler.
  if (s.pendingMenu === 'displayMode') {
    if (key === 'AC')  return clearShifts({ ...s, pendingMenu: null });
    if (key === 'D1')  return clearShifts({ ...s, pendingMenu: 'fix' });
    if (key === 'D2')  return clearShifts({ ...s, pendingMenu: 'sci' });
    if (key === 'D3')  return clearShifts({ ...s, pendingMenu: null, displayMode: 'NORM', fixDigits: null, sciDigits: null });
    return s;
  }
  if (s.pendingMenu === 'fix') {
    if (key === 'AC')  return clearShifts({ ...s, pendingMenu: null });
    if (key.startsWith('D') && key.length === 2) {
      const d = parseInt(key[1], 10);
      return clearShifts({ ...s, pendingMenu: null, displayMode: 'FIX', fixDigits: d, sciDigits: null });
    }
    return s;
  }
  if (s.pendingMenu === 'sci') {
    if (key === 'AC')  return clearShifts({ ...s, pendingMenu: null });
    if (key.startsWith('D') && key.length === 2) {
      // SCI 0 en la fx-82MS real significa 10 dígitos; aquí lo dejamos en 0 por simplicidad.
      const d = parseInt(key[1], 10);
      return clearShifts({ ...s, pendingMenu: null, displayMode: 'SCI', sciDigits: d, fixDigits: null });
    }
    return s;
  }
  // Captura de coeficientes para ecuación cuadrática (a, b, c).
  if (s.pendingMenu === 'quadA' || s.pendingMenu === 'quadB' || s.pendingMenu === 'quadC') {
    if (key === 'AC') return clearShifts({ ...s, pendingMenu: null, quadCoeffs: null, formula: '', cursor: 0, showResult: false });
    if (key === 'EQ') {
      try {
        const sdStats = computeSDStats(s.sdData || []);
        const value = evaluate(autoCloseParens(s.formula || '0'), { angleMode: s.angleMode, ans: s.ans, M: s.M, sdStats });
        if (s.pendingMenu === 'quadA') {
          return clearShifts({ ...s, pendingMenu: 'quadB', quadCoeffs: { a: Number(value) }, formula: '', cursor: 0, showResult: false });
        }
        if (s.pendingMenu === 'quadB') {
          return clearShifts({ ...s, pendingMenu: 'quadC', quadCoeffs: { ...s.quadCoeffs, b: Number(value) }, formula: '', cursor: 0, showResult: false });
        }
        // quadC → resolver
        const c = Number(value);
        const { a, b } = s.quadCoeffs;
        const solved = solveQuadratic(a, b, c);
        return clearShifts({
          ...s,
          pendingMenu: null,
          quadCoeffs: null,
          formula: `${a}x²+(${b})x+(${c})=0`,
          cursor: 0,
          result: solved.primary,
          resultText: solved.label,
          ans: typeof solved.primary === 'number' ? solved.primary : s.ans,
          showResult: true,
          error: null
        });
      } catch {
        return clearShifts({ ...s, error: 'Syntax ERROR', resultText: 'Syntax ERROR', showResult: true });
      }
    }
    // En modo captura, dejamos pasar el resto para que el usuario teclee la expresión.
  }

  // Navegación
  if (key === 'LEFT')  return clearShifts({ ...s, cursor: Math.max(0, s.cursor - 1), showResult: false });
  if (key === 'RIGHT') return clearShifts({ ...s, cursor: Math.min(s.formula.length, s.cursor + 1), showResult: false });
  if (key === 'UP') {
    const idx = s.historyIndex + 1;
    if (idx < history.length) {
      const item = history[idx];
      return clearShifts({ ...s, formula: item.formula, cursor: item.formula.length, historyIndex: idx, showResult: false });
    }
    return clearShifts(s);
  }
  if (key === 'DOWN') {
    const idx = s.historyIndex - 1;
    if (idx >= 0) {
      const item = history[idx];
      return clearShifts({ ...s, formula: item.formula, cursor: item.formula.length, historyIndex: idx, showResult: false });
    }
    return clearShifts({ ...s, formula: '', cursor: 0, historyIndex: -1, showResult: false });
  }

  // AC / DEL
  if (key === 'AC')  return clearShifts({ ...s, formula: '', cursor: 0, result: null, resultText: '0.', showResult: false, error: null, historyIndex: -1 });
  if (key === 'DEL') {
    if (s.cursor === 0) return clearShifts(s);
    const before = s.formula.slice(0, s.cursor - 1);
    const after  = s.formula.slice(s.cursor);
    return clearShifts({ ...s, formula: before + after, cursor: s.cursor - 1, showResult: false, error: null });
  }

  // MODE
  if (key === 'MODE') {
    if (shifted) {
      // SHIFT+MODE = SETUP → menú Fix/Sci/Norm.
      return clearShifts({ ...s, pendingMenu: 'displayMode' });
    }
    // ciclo COMP / SD
    const nextMode = s.mode === 'COMP' ? 'SD' : 'COMP';
    return clearShifts({ ...s, mode: nextMode, formula: '', cursor: 0, showResult: false });
  }

  // DRG: SHIFT + ; cicla DEG → RAD → GRAD.
  if (key === 'COMMA' && shifted) {
    const next = s.angleMode === 'DEG' ? 'RAD' : s.angleMode === 'RAD' ? 'GRAD' : 'DEG';
    return clearShifts({ ...s, angleMode: next });
  }

  // Modo SD: tecla M+ funciona como DT (data input)
  if (s.mode === 'SD' && key === 'MPLUS' && !shifted) {
    try {
      const sdStats = computeSDStats(s.sdData || []);
      const value = evaluate(s.formula || String(s.ans), { angleMode: s.angleMode, ans: s.ans, M: s.M, sdStats });
      const sdData = [...s.sdData, Number(value)];
      return clearShifts({ ...s, sdData, formula: '', cursor: 0, resultText: formatNumber(value), showResult: true });
    } catch { return clearShifts({ ...s, error: 'Syntax ERROR', resultText: 'Syntax ERROR', showResult: true }); }
  }

  // Modo SD: SHIFT + dígito 1..6 inserta variables estadísticas.
  if (s.mode === 'SD' && shifted && key.startsWith('D') && key.length === 2) {
    const map = { 'D1': 'x̄', 'D2': 'σn', 'D3': 'σn-1', 'D4': 'n', 'D5': 'Σx', 'D6': 'Σx²' };
    const sym = map[key];
    if (sym) return withInsert(s, sym);
  }

  // SHIFT + 0/7/8/9 y SHIFT + . — funciones disponibles en cualquier modo.
  if (shifted) {
    const fnMap = { 'D0': 'random()', 'D7': 'abs(', 'D8': 'floor(', 'D9': 'frac(' };
    if (fnMap[key]) return clearShifts(insertText(s, fnMap[key]));
    if (key === 'DOT') return clearShifts(insertText(s, 'round('));
  }

  // Inserciones de tokens
  const ins = (text) => withInsert(s, text);

  // Dígitos y básicos
  const digit = key.startsWith('D') && key.length === 2 ? key[1] : null;
  if (digit !== null) return ins(digit);
  if (key === 'DOT')    return ins('.');
  if (key === 'PLUS')   return ins('+');
  if (key === 'MINUS')  return ins('−');
  if (key === 'MUL')    return ins('×');
  if (key === 'DIV')    return ins('÷');
  if (key === 'LPAREN') return ins('(');
  if (key === 'RPAREN') return ins(')');
  if (key === 'COMMA')  return ins(';');
  if (key === 'PERCENT_PHYS') return ins('%');
  if (key === 'NEG')    return ins('(-)');

  // Trig y log
  const trig = (fn, inv) => ins(s.hyp ? `${inv ? 'a' : ''}${fn}h(` : `${inv ? 'a' : ''}${fn}(`);
  if (key === 'SIN') return clearShifts({ ...trig('sin', shifted), hyp: false });
  if (key === 'COS') return clearShifts({ ...trig('cos', shifted), hyp: false });
  if (key === 'TAN') return clearShifts({ ...trig('tan', shifted), hyp: false });

  if (key === 'LOG') return shifted ? ins('10^(') : ins('log(');
  if (key === 'LN')  return shifted ? ins('e^(')  : ins('ln(');

  // Potencias / raíces
  if (key === 'SQRT') return shifted ? ins('∛(') : ins('√(');
  if (key === 'POW2') return shifted ? ins('³') : ins('²');
  if (key === 'POW')  return ins('^');
  if (key === 'INV')  return shifted ? ins('!') : ins('⁻¹');
  if (key === 'NCR')  return shifted ? ins(' permutations(') : ins(' combinations(');

  // π y EXP (×10^(...) estilo Casio)
  if (key === 'EXP')  return shifted ? ins('π') : ins('×10^(');

  // Memoria
  if (key === 'RCL') {
    if (shifted) return clearShifts({ ...s, M: typeof s.result === 'number' ? s.result : s.ans });
    return clearShifts({ ...insertText(s, 'M'), shift: false });
  }
  if (key === 'MPLUS') {
    if (shifted) return clearShifts({ ...s, M: s.M - (typeof s.result === 'number' ? s.result : s.ans) });
    return clearShifts({ ...s, M: s.M + (typeof s.result === 'number' ? s.result : s.ans) });
  }

  // ENG / DMS / Ans
  if (key === 'ANS')  return ins('Ans');
  if (key === 'DMS') {
    // SHIFT+DMS: convertir resultado decimal a D°M'S".
    if (shifted && s.showResult && typeof s.result === 'number' && Number.isFinite(s.result)) {
      return clearShifts({ ...s, resultText: toDMS(s.result) });
    }
    // Pulsación normal: ciclar °, ', " según el último delimitador en el grupo actual.
    const before = s.formula.slice(0, s.cursor);
    let lastDms = null;
    for (let i = before.length - 1; i >= 0; i--) {
      const c = before[i];
      if (c === '°' || c === '\'' || c === '"') { lastDms = c; break; }
      if (/[+\-×÷*\/^(),]/.test(c)) break;
    }
    let next = '°';
    if (lastDms === '°')        next = '\'';
    else if (lastDms === '\'')  next = '"';
    return ins(next);
  }
  if (key === 'ENG') {
    // SHIFT+ENG → resolver ecuación cuadrática ax²+bx+c=0.
    if (shifted) {
      return clearShifts({ ...s, pendingMenu: 'quadA', quadCoeffs: {}, formula: '', cursor: 0, showResult: false });
    }
    if (!s.showResult || typeof s.result !== 'number' || !Number.isFinite(s.result)) {
      return clearShifts(s);
    }
    const newOffset = (s.engOffset === null || s.engOffset === undefined)
      ? 0
      : s.engOffset + (shifted ? -3 : 3);
    return clearShifts({
      ...s,
      engOffset: newOffset,
      resultText: formatEng(s.result, newOffset)
    });
  }

  // = : evaluar y guardar en historial
  if (key === 'EQ') {
    const evaluated = evalCurrent(s);
    if (!evaluated.error && s.formula.trim()) {
      pushHistory({ formula: s.formula, result: evaluated.resultText });
    }
    return clearShifts(evaluated);
  }

  return clearShifts(s);
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...initialState, ...(loadPersisted() || {}) }));
  const historyRef = useRef(loadHistory());
  const [, force] = useReducer(x => x + 1, 0);

  const pushHistory = useCallback((entry) => {
    historyRef.current = [entry, ...historyRef.current].slice(0, 50);
    persist(state, historyRef.current);
    force();
  }, [state]);

  useEffect(() => {
    persist(state, historyRef.current);
  }, [state.ans, state.M, state.angleMode, state.displayMode, state.fixDigits, state.sciDigits, state.mode, state.sdData]);

  const dispatchKey = useCallback((key) => {
    if (key === 'EQ' && state.formula.trim()) {
      try {
        const value = evaluate(state.formula, { angleMode: state.angleMode, ans: state.ans, M: state.M });
        historyRef.current = [{ formula: state.formula, result: formatNumber(value, { fix: state.fixDigits, sci: state.sciDigits }) }, ...historyRef.current].slice(0, 50);
        persist(state, historyRef.current);
      } catch { /* ignore */ }
    }
    dispatch({ type: 'KEY', key, history: historyRef.current, dispatchHistory: pushHistory });
  }, [state, pushHistory]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    force();
  }, []);

  const sdStats = useMemo(() => computeSDStats(state.sdData), [state.sdData]);

  return {
    state,
    history: historyRef.current,
    sdStats,
    dispatchKey,
    clearHistory,
    loadFromHistory: (item) => dispatch({ type: 'LOAD_FROM_HISTORY', item })
  };
}

function computeSDStats(data) {
  const n = data.length;
  if (n === 0) return { n: 0, sum: 0, sumSq: 0, mean: 0, sigmaN: 0, sigmaN1: 0 };
  const sum = data.reduce((a, b) => a + b, 0);
  const sumSq = data.reduce((a, b) => a + b * b, 0);
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const sigmaN = Math.sqrt(Math.max(0, variance));
  const sigmaN1 = n > 1 ? Math.sqrt(Math.max(0, (sumSq - n * mean * mean) / (n - 1))) : 0;
  return { n, sum, sumSq, mean, sigmaN, sigmaN1 };
}
