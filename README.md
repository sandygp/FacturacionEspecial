# English Compass

Aplicación web para mejorar el inglés en las seis destrezas del Marco Común Europeo de Referencia (MCER, niveles A1–C2): diagnostica tu nivel actual, genera un plan para llegar al siguiente nivel y te permite practicar y medir tu progreso.

## Qué hace

**1. Diagnóstico adaptativo (≈ 20 min)**
- **Lectura** y **comprensión auditiva**: un texto o audio por nivel con 3 preguntas. El audio se reproduce con la voz sintética del navegador (máximo 2 escuchas).
- **Gramática** y **vocabulario**: bloques de 3 preguntas por nivel.
- La prueba empieza en B1; si aciertas 2 de 3 sube de nivel, si no, baja. El nivel final es el más alto superado.
- **Escritura**: un texto de 80–150 palabras analizado automáticamente (longitud de frase, riqueza léxica con el índice de Guiraud, conectores, estructuras como relativas, condicionales, pasiva o inversión) combinado con descriptores «puedo…» del MCER.
- **Expresión oral**: autoevaluación con descriptores del MCER.
- Resultado: nivel por destreza, nivel global y nivel objetivo.

**2. Plan personalizado**
- Calcula las semanas necesarias a partir de las horas de aprendizaje guiado de referencia (Cambridge English) y de tu disponibilidad (minutos al día y días por semana).
- Da más tiempo a las destrezas por debajo del objetivo y practica cada una en su nivel + 1.
- Semana tipo con bloques diarios, fases (base, consolidación, transferencia), hitos (re-diagnóstico, simulacros, examen Cambridge del nivel objetivo) y actividades concretas por destreza.

**3. Práctica**
- Gramática y vocabulario con corrección inmediata y explicación en español.
- Lectura y escucha con velocidad ajustable y transcripción al terminar.
- Escritura con consignas por nivel y análisis del texto.
- Expresión oral: *shadowing* (escuchar y repetir, con reconocimiento de voz si el navegador lo permite) y charlas cronometradas con autoevaluación.

**4. Progreso**
- Racha de días, minutos semanales frente al plan, aciertos y tiempo por destreza, historial de diagnósticos y últimas sesiones.
- Las tareas del día se marcan solas al completar una práctica de esa destreza.

Los datos se guardan en el `localStorage` del navegador; no hay servidor ni cuentas.

## Uso

No necesita instalación ni compilación. Abre `index.html` en un navegador moderno o sírvelo con cualquier servidor estático:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

La voz sintética y el reconocimiento de voz dependen del navegador (Chrome y Edge ofrecen ambos). Sin voz sintética, la escucha muestra la transcripción.

Para obtener un único archivo HTML autocontenido:

```bash
python3 scripts/build_single.py   # genera dist/english-compass.html
```

## Estructura

```
index.html            Estructura y navegación
css/styles.css        Estilos (tema claro y oscuro)
js/data.js            Banco de contenidos: preguntas, textos, audios, consignas, descriptores y actividades por nivel
js/app.js             Lógica: diagnóstico, cálculo de niveles, generador de plan, práctica y progreso
scripts/build_single.py  Empaqueta todo en un solo HTML
```

## Ampliar contenidos

Todo el contenido está en `js/data.js`, indexado por nivel (0 = A1 … 5 = C2). Para añadir preguntas de gramática o vocabulario, agrega objetos `{ q, options, answer, explain }` al nivel correspondiente: los tres primeros de cada nivel se usan en el diagnóstico y todos en la práctica.

## Limitaciones

- El diagnóstico es orientativo y no sustituye a un examen oficial.
- El análisis de escritura mide complejidad, no corrección gramatical.
- La expresión oral se basa en autoevaluación.
