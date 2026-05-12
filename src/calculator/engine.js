import { create, all } from 'mathjs';

const math = create(all, { number: 'number', precision: 14 });

function toRad(x, mode) {
  if (mode === 'DEG')  return x * Math.PI / 180;
  if (mode === 'GRAD') return x * Math.PI / 200;
  return x;
}
function fromRad(x, mode) {
  if (mode === 'DEG')  return x * 180 / Math.PI;
  if (mode === 'GRAD') return x * 200 / Math.PI;
  return x;
}

function buildScope({ angleMode, ans, M, sdStats }) {
  return {
    Ans: ans,
    M,
    // Variables estadísticas (modo SD); 0 si no hay datos.
    sdMean:    sdStats?.mean    ?? 0,
    sdSigmaN:  sdStats?.sigmaN  ?? 0,
    sdSigmaN1: sdStats?.sigmaN1 ?? 0,
    sdN:       sdStats?.n       ?? 0,
    sdSum:     sdStats?.sum     ?? 0,
    sdSumSq:   sdStats?.sumSq   ?? 0,
    sin:  (x) => Math.sin(toRad(x, angleMode)),
    cos:  (x) => Math.cos(toRad(x, angleMode)),
    tan:  (x) => Math.tan(toRad(x, angleMode)),
    asin: (x) => fromRad(Math.asin(x), angleMode),
    acos: (x) => fromRad(Math.acos(x), angleMode),
    atan: (x) => fromRad(Math.atan(x), angleMode),
    sinh: (x) => Math.sinh(x),
    cosh: (x) => Math.cosh(x),
    tanh: (x) => Math.tanh(x),
    asinh: (x) => Math.asinh(x),
    acosh: (x) => Math.acosh(x),
    atanh: (x) => Math.atanh(x),
    // Logaritmos estilo Casio: log = base 10, ln = natural.
    // (mathjs por defecto define log() como natural — lo reescribimos.)
    log: (x) => Math.log10(x),
    ln:  (x) => Math.log(x),
    // Parte fraccionaria (mathjs no la trae directa).
    frac: (x) => x - Math.floor(x)
  };
}

// Auto-cierra paréntesis abiertos pendientes (la fx-82MS hace esto al pulsar =).
export function autoCloseParens(formula) {
  const open  = (formula.match(/\(/g) || []).length;
  const close = (formula.match(/\)/g) || []).length;
  if (open > close) return formula + ')'.repeat(open - close);
  return formula;
}

// Aplica la semántica del porcentaje estilo Casio:
//   A + B%  → A + A·B/100
//   A − B%  → A − A·B/100
//   A × B%  → A · B/100
//   A ÷ B%  → A / (B/100)
//   B% (sin operador previo) → B/100
// La regex toma el operador binario más a la derecha antes del % y reescribe esa porción.
function applyPercentage(expr) {
  let prev;
  do {
    prev = expr;
    // Captura: LHS, operador binario, término sin %/operador, %, resto.
    const m = expr.match(/^(.*)([+\-*/])([^+\-*/%]*?)%(.*)$/s);
    if (m) {
      const [, A, op, B, rest] = m;
      const a = `(${A})`, b = `(${B})`;
      let rep;
      if (op === '+') rep = `${a}+${a}*${b}/100`;
      else if (op === '-') rep = `${a}-${a}*${b}/100`;
      else if (op === '*') rep = `${a}*${b}/100`;
      else rep = `${a}/(${b}/100)`;
      expr = rep + rest;
    }
  } while (expr !== prev);
  // % residuales sin operador binario: tratar como /100.
  expr = expr.replace(/(\d+(?:\.\d+)?|\))%/g, '($1/100)');
  return expr;
}

// Convierte D°M'S" a decimal (grados-minutos-segundos sexagesimales).
// Acepta minutos/segundos vacíos: 30°15'" o 30°' equivalen a 30°15'0" / 30°.
function dmsToDecimal(expr) {
  let r = expr.replace(
    /(-?\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)?')?(?:(\d+(?:\.\d+)?)?")?/g,
    (full, d, m, sec) => {
      const D = parseFloat(d);
      const M = parseFloat(m || '0');
      const S = parseFloat(sec || '0');
      const sign = D < 0 ? -1 : 1;
      const dec = sign * (Math.abs(D) + M / 60 + S / 3600);
      return `(${dec})`;
    }
  );
  // Limpia °, ', " sueltos (insertados por error sin dígito previo)
  // para evitar Syntax ERROR al evaluar.
  r = r.replace(/[°'"]/g, '');
  return r;
}

// Resuelve ax²+bx+c=0. Devuelve { primary, label }. label es la cadena visible.
export function solveQuadratic(a, b, c) {
  if (a === 0) {
    // Ecuación lineal: bx + c = 0 → x = -c/b
    if (b === 0) {
      return { primary: NaN, label: c === 0 ? 'Indet.' : 'No solución' };
    }
    const x = -c / b;
    return { primary: x, label: `x=${formatNumber(x)}` };
  }
  const D = b * b - 4 * a * c;
  if (D >= 0) {
    const root = Math.sqrt(D);
    const x1 = (-b + root) / (2 * a);
    const x2 = (-b - root) / (2 * a);
    if (D === 0) return { primary: x1, label: `x=${formatNumber(x1)}` };
    return { primary: x1, label: `x₁=${formatNumber(x1)}; x₂=${formatNumber(x2)}` };
  }
  // Raíces complejas
  const re = -b / (2 * a);
  const im = Math.sqrt(-D) / (2 * a);
  return { primary: re, label: `x=${formatNumber(re)}±${formatNumber(im)}i` };
}

// Convierte un decimal en grados a representación DMS: 12.5 → "12°30'0\"".
export function toDMS(decimalDeg) {
  if (typeof decimalDeg !== 'number' || !Number.isFinite(decimalDeg)) return String(decimalDeg);
  const sign = decimalDeg < 0 ? '-' : '';
  let abs = Math.abs(decimalDeg);
  const D = Math.floor(abs);
  abs = (abs - D) * 60;
  const M = Math.floor(abs);
  const S = (abs - M) * 60;
  const sStr = String(Number(S.toPrecision(8)));
  return `${sign}${D}°${M}'${sStr}"`;
}

// Convierte la cadena visible en una expresión válida para mathjs.
export function toMathExpr(formula) {
  let expr = formula
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\(/g, 'sqrt(')
    .replace(/∛\(/g, 'cbrt(')
    .replace(/⁻¹/g, '^(-1)')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\(-\)/g, '-');

  // Separador de argumentos visible (;) → coma de mathjs.
  expr = expr.replace(/;/g, ',');

  // Variables estadísticas visibles → identificadores internos.
  // Importante: σn-1 y Σx² antes que σn y Σx (longest-match).
  expr = expr
    .replace(/σn-1/g, 'sdSigmaN1')
    .replace(/σn/g,   'sdSigmaN')
    .replace(/x̄/g,    'sdMean')
    .replace(/Σx²/g,  'sdSumSq')
    .replace(/Σx/g,   'sdSum');
  // 'n' aislado (palabra completa) en modo SD: substituir solo cuando
  // aparece como token y no dentro de identificadores como sin, ln, etc.
  expr = expr.replace(/(?<![A-Za-z_])n(?![A-Za-z_0-9])/g, 'sdN');

  // DMS: D°M'S" → decimal (antes de la multiplicación implícita y la
  // notación científica para que los símbolos no se mezclen).
  expr = dmsToDecimal(expr);

  // Notación científica visible: 1.5×10^(3) ya queda como 1.5*10^(3) tras la línea anterior.
  // Soporte del antiguo token 'E' por compatibilidad: 1.5E3 → 1.5e3.
  expr = expr.replace(/(\d)E([+-]?\d)/g, '$1e$2');

  // Porcentaje contextual estilo Casio.
  expr = applyPercentage(expr);

  // Multiplicación implícita: 2(3) → 2*(3), )( → )*(, 2pi → 2*pi
  expr = expr.replace(/\)(\(|[A-Za-z_])/g, ')*$1');
  expr = expr.replace(/(\d)([A-Za-z_(])/g, (m, a, b) => {
    if (b === 'e' || b === 'E') return m;
    return `${a}*${b}`;
  });

  return expr;
}

export function evaluate(formula, ctx = {}) {
  if (!formula || !formula.trim()) throw new Error('Empty');
  const expr = toMathExpr(formula);
  const scope = buildScope({
    angleMode: ctx.angleMode || 'DEG',
    ans: ctx.ans ?? 0,
    M: ctx.M ?? 0,
    sdStats: ctx.sdStats
  });
  const value = math.evaluate(expr, scope);
  if (value === undefined) throw new Error('Empty');
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return value.toNumber();
  }
  return value;
}

// Convierte "1.234e+9" → "1.234×10^9", estilo fx-82MS.
function toCasioExponential(s) {
  const m = s.match(/^(-?\d+(?:\.\d+)?)e([+-]?\d+)$/);
  if (!m) return s;
  let mantissa = m[1];
  const exp = parseInt(m[2], 10);
  // Limpia ceros sobrantes a la derecha de la mantisa.
  if (mantissa.includes('.')) mantissa = mantissa.replace(/\.?0+$/, '');
  return `${mantissa}×10^${exp}`;
}

// Formato ingeniería: exponente múltiplo de 3 con offset adicional.
//   formatEng(1234)         → "1.234×10^3"
//   formatEng(1234, 3)      → "0.001234×10^6"   (un paso ENG)
//   formatEng(1234, -3)     → "1234×10^0" → "1234"
export function formatEng(n, offset = 0) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return formatNumber(n);
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  // Exponente "natural" eng: mayor múltiplo de 3 ≤ floor(log10(abs)).
  const baseExp = Math.floor(Math.log10(abs));
  const engExpBase = Math.floor(baseExp / 3) * 3;
  const exp = engExpBase + offset;
  const mantissa = abs / Math.pow(10, exp);
  // Limita a 12 dígitos significativos.
  let mStr = String(Number(mantissa.toPrecision(12)));
  if (exp === 0) return `${sign}${mStr}`;
  return `${sign}${mStr}×10^${exp}`;
}

export function formatNumber(n, { fix = null, sci = null } = {}) {
  if (n === null || n === undefined) return '';
  if (typeof n !== 'number') {
    try { n = Number(n); } catch { return String(n); }
  }
  if (Number.isNaN(n)) return 'Math ERROR';
  if (!Number.isFinite(n)) return 'Math ERROR';
  if (sci !== null) return toCasioExponential(n.toExponential(sci));
  if (fix !== null) return n.toFixed(fix);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-9)) return toCasioExponential(n.toExponential(9));
  return String(Number(n.toPrecision(12)));
}
