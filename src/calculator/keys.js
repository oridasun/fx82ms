// Definición del teclado de la fx-82MS.
// `TOP_CONTROLS` se renderiza como un bloque especial (SHIFT/ALPHA + cruceta REPLAY + MODE/ON).
// `KEYS` son las filas regulares de funciones, números y operadores (5 columnas cada una).

export const TOP_CONTROLS = {
  // Columnas verticales a los lados de la cruceta REPLAY.
  left:  [
    { id: 'SHIFT', main: 'SHIFT', className: 'k-shift' },
    { id: 'ALPHA', main: 'ALPHA', className: 'k-alpha' }
  ],
  right: [
    { id: 'SETUP', main: 'SETUP', className: 'k-mode' },
    { id: 'MODE',  main: 'MODE',  className: 'k-mode' }
  ],
  dpad: {
    up:    { id: 'UP',    label: '▲' },
    left:  { id: 'LEFT',  label: '◀' },
    right: { id: 'RIGHT', label: '▶' },
    down:  { id: 'DOWN',  label: '▼' },
    center: { label: 'REPLAY' }
  }
};

export const KEYS = [
  // Funciones inversas / potencias / log
  [
    { id: 'INV',  top: 'x!',   main: 'x⁻¹', className: 'k-fn' },
    { id: 'NCR',  top: 'nPr',  main: 'nCr', className: 'k-fn' },
    { id: 'LOG',  top: '10ˣ',  main: 'log', className: 'k-fn' },
    { id: 'LN',   top: 'eˣ',   main: 'ln',  className: 'k-fn' },
    { id: 'HYP',  main: 'hyp',              className: 'k-fn' }
  ],
  // Raíces, cuadrado, ^, negación, DMS
  [
    { id: 'SQRT', top: '∛',  main: '√',   className: 'k-fn' },
    { id: 'POW2', top: 'x³', main: 'x²',  className: 'k-fn' },
    { id: 'POW',  top: 'EQN', main: '^',  className: 'k-fn' },
    { id: 'NEG',              main: '(-)', className: 'k-fn' },
    { id: 'DMS',  top: '←',  main: '°’”', className: 'k-fn' }
  ],
  // Trigonometría + RCL + M+
  [
    { id: 'SIN',   top: 'sin⁻¹', main: 'sin', className: 'k-fn' },
    { id: 'COS',   top: 'cos⁻¹', main: 'cos', className: 'k-fn' },
    { id: 'TAN',   top: 'tan⁻¹', main: 'tan', className: 'k-fn' },
    { id: 'RCL',   top: 'STO',   main: 'RCL', className: 'k-fn' },
    { id: 'MPLUS', top: 'M-/DT', main: 'M+',  className: 'k-fn' }
  ],
  // Paréntesis, separador de argumentos, ENG, Ans
  [
    { id: 'LPAREN', main: '(', className: 'k-fn' },
    { id: 'RPAREN', main: ')', className: 'k-fn' },
    { id: 'COMMA',  top: 'DRG▶', main: ';',   className: 'k-fn' },
    { id: 'ENG',    top: '←',    main: 'ENG', className: 'k-fn' },
    { id: 'ANS',                 main: 'Ans', className: 'k-fn' }
  ],
  // Números fila 7-9, DEL, AC
  [
    { id: 'D7',  top: 'Abs',  main: '7', className: 'k-num' },
    { id: 'D8',  top: 'Int',  main: '8', className: 'k-num' },
    { id: 'D9',  top: 'Frac', main: '9', className: 'k-num' },
    { id: 'DEL', main: 'DEL', className: 'k-edit' },
    { id: 'AC',  main: 'AC',  className: 'k-ac' }
  ],
  [
    { id: 'D4', top: 'n',   main: '4', className: 'k-num' },
    { id: 'D5', top: 'Σx',  main: '5', className: 'k-num' },
    { id: 'D6', top: 'Σx²', main: '6', className: 'k-num' },
    { id: 'MUL', main: '×', className: 'k-op' },
    { id: 'DIV', main: '÷', className: 'k-op' }
  ],
  [
    { id: 'D1', top: 'x̄',    main: '1', className: 'k-num' },
    { id: 'D2', top: 'σn',   main: '2', className: 'k-num' },
    { id: 'D3', top: 'σn-1', main: '3', className: 'k-num' },
    { id: 'PLUS',  main: '+', className: 'k-op' },
    { id: 'MINUS', main: '−', className: 'k-op' }
  ],
  // Última fila: 0, ., EXP, = (con doble ancho)
  [
    { id: 'D0',  top: 'Ran#', main: '0', className: 'k-num' },
    { id: 'DOT', top: 'Rnd',  main: '.', className: 'k-num' },
    { id: 'EXP', top: 'π',    main: '×10ˣ', className: 'k-fn' },
    { id: 'EQ',  main: '=',  className: 'k-eq', span: 2 }
  ]
];

// Mapeo de teclado físico → id de tecla virtual.
export const PHYSICAL_KEY_MAP = {
  '0': 'D0', '1': 'D1', '2': 'D2', '3': 'D3', '4': 'D4',
  '5': 'D5', '6': 'D6', '7': 'D7', '8': 'D8', '9': 'D9',
  '.': 'DOT',
  '+': 'PLUS', '-': 'MINUS', '*': 'MUL', '/': 'DIV',
  '(': 'LPAREN', ')': 'RPAREN',
  '^': 'POW', '%': 'PERCENT_PHYS',
  ',': 'COMMA',
  Enter: 'EQ', '=': 'EQ',
  Backspace: 'DEL', Escape: 'AC', Delete: 'AC',
  ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', ArrowUp: 'UP', ArrowDown: 'DOWN'
};
