/*
 * English Compass — banco de contenidos.
 * Niveles indexados 0..5 = A1, A2, B1, B2, C1, C2 (MCER / CEFR).
 * En gramática y vocabulario, los 3 primeros ítems de cada nivel se usan en el diagnóstico;
 * todos se usan en la práctica.
 */
window.EC_DATA = {
  // Horas de aprendizaje guiado aproximadas para pasar de un nivel al siguiente
  // (referencia orientativa de Cambridge English). Índice = nivel de partida.
  hours: [100, 180, 200, 200, 350],

  exams: [
    'Cambridge A1 Movers / Trinity GESE 2',
    'Cambridge A2 Key (KET)',
    'Cambridge B1 Preliminary (PET)',
    'Cambridge B2 First (FCE)',
    'Cambridge C1 Advanced (CAE)',
    'Cambridge C2 Proficiency (CPE)'
  ],

  grammar: [
    [ // A1
      { q: 'She ___ a teacher.', options: ['am', 'is', 'are', 'be'], answer: 1, explain: 'Con he/she/it el verbo to be es "is".' },
      { q: 'I ___ like coffee.', options: ["doesn't", "don't", 'not', "isn't"], answer: 1, explain: 'Negativa en presente simple con I/you/we/they: "don\'t" + verbo.' },
      { q: 'There ___ two books on the table.', options: ['is', 'are', 'be', 'am'], answer: 1, explain: '"There are" con sustantivos en plural.' },
      { q: '___ you speak English?', options: ['Do', 'Does', 'Are', 'Is'], answer: 0, explain: 'Preguntas en presente simple con you: "Do".' },
      { q: 'This is ___ book.', options: ['me', 'my', 'I', 'mine'], answer: 1, explain: 'Delante de un sustantivo va el posesivo "my".' }
    ],
    [ // A2
      { q: 'Yesterday we ___ to the cinema.', options: ['go', 'goes', 'went', 'gone'], answer: 2, explain: '"Yesterday" pide pasado simple; "go" es irregular: went.' },
      { q: 'This book is ___ than that one.', options: ['interesting', 'more interesting', 'most interesting', 'interestinger'], answer: 1, explain: 'Adjetivos largos forman el comparativo con "more ... than".' },
      { q: 'Look! It ___.', options: ['rains', 'is raining', 'rain', 'rained'], answer: 1, explain: '"Look!" indica algo que ocurre ahora: presente continuo.' },
      { q: 'I ___ never been to Japan.', options: ['has', 'have', 'am', 'did'], answer: 1, explain: 'Present perfect con I: "have" + participio.' },
      { q: 'How ___ money do you have?', options: ['many', 'much', 'more', 'lot'], answer: 1, explain: '"Money" es incontable: "how much".' }
    ],
    [ // B1
      { q: 'I ___ in Madrid since 2019.', options: ['live', 'am living', 'have lived', 'lived'], answer: 2, explain: '"Since" + punto en el pasado que llega al presente: present perfect.' },
      { q: 'If it rains tomorrow, we ___ at home.', options: ['stay', 'will stay', 'would stay', 'stayed'], answer: 1, explain: 'Primer condicional: if + presente, will + infinitivo.' },
      { q: 'The letter ___ yesterday.', options: ['was sent', 'sent', 'has sent', 'is sending'], answer: 0, explain: 'La carta no envía: recibe la acción. Pasiva en pasado: was + participio.' },
      { q: 'I used to ___ football when I was a child.', options: ['play', 'playing', 'played', 'plays'], answer: 0, explain: '"Used to" + infinitivo sin "to".' },
      { q: 'She asked me where I ___.', options: ['live', 'lived', 'do live', 'did live'], answer: 1, explain: 'Estilo indirecto: el tiempo retrocede y no se invierte el orden.' }
    ],
    [ // B2
      { q: 'If I ___ more time, I would learn Japanese.', options: ['have', 'had', 'would have', 'will have'], answer: 1, explain: 'Segundo condicional: if + pasado, would + infinitivo.' },
      { q: 'By the time we arrived, the film ___.', options: ['already started', 'has already started', 'had already started', 'was already starting'], answer: 2, explain: 'Acción anterior a otra en el pasado: past perfect.' },
      { q: 'She suggested ___ a taxi.', options: ['to take', 'taking', 'take', 'that taking'], answer: 1, explain: '"Suggest" va seguido de gerundio (-ing).' },
      { q: 'I wish I ___ harder at school.', options: ['studied', 'had studied', 'would study', 'study'], answer: 1, explain: 'Lamento sobre el pasado: wish + past perfect.' },
      { q: 'The house ___ when we arrived.', options: ['was being painted', 'was painting', 'has been painted', 'painted'], answer: 0, explain: 'Pasiva en pasado continuo: was being + participio.' }
    ],
    [ // C1
      { q: '___ had I sat down than the phone rang.', options: ['Hardly', 'No sooner', 'Scarcely', 'Barely'], answer: 1, explain: '"No sooner ... than"; hardly/scarcely/barely van con "when".' },
      { q: "I'd rather you ___ tell anyone about this.", options: ["don't", "didn't", "won't", 'not'], answer: 1, explain: '"I\'d rather" + otro sujeto pide pasado con valor de presente.' },
      { q: 'Had I known about the delay, I ___ earlier.', options: ['would leave', 'would have left', 'will have left', 'had left'], answer: 1, explain: 'Tercer condicional con inversión: would have + participio.' },
      { q: 'Not only ___ late, but he also forgot the documents.', options: ['he arrived', 'did he arrive', 'he did arrive', 'arrived he'], answer: 1, explain: '"Not only" al inicio exige inversión con auxiliar.' },
      { q: "She must ___ the train; she's not here yet.", options: ['miss', 'have missed', 'had missed', 'missing'], answer: 1, explain: 'Deducción sobre el pasado: must have + participio.' }
    ],
    [ // C2
      { q: 'Little ___ that the decision would cost him his career.', options: ['he knew', 'did he know', 'he did know', 'knew he'], answer: 1, explain: '"Little" negativo al inicio provoca inversión: did he know.' },
      { q: 'The proposal, ___ merits are debatable, was approved.', options: ['which', 'whose', 'that', 'of which'], answer: 1, explain: 'Posesión dentro de una relativa: "whose merits".' },
      { q: 'Were the board ___ the merger, shares would plummet.', options: ['to reject', 'rejecting', 'rejected', 'reject'], answer: 0, explain: 'Condicional hipotético formal: were + sujeto + to + infinitivo.' },
      { q: 'So ___ the storm that all flights were grounded.', options: ['severe was', 'was severe', 'severe', 'severely was'], answer: 0, explain: 'Inversión enfática: so + adjetivo + verbo + sujeto.' },
      { q: 'Should you ___ any further assistance, do not hesitate to contact us.', options: ['require', 'required', 'requiring', 'to require'], answer: 0, explain: '"Should" en inversión condicional + infinitivo sin "to".' }
    ]
  ],

  vocabulary: [
    [ // A1
      { q: "The opposite of 'big' is ___.", options: ['small', 'tall', 'long', 'old'], answer: 0 },
      { q: 'We eat ___ in the morning.', options: ['breakfast', 'dinner', 'lunch', 'supper'], answer: 0 },
      { q: "My mother's brother is my ___.", options: ['cousin', 'uncle', 'nephew', 'grandfather'], answer: 1 },
      { q: "I'm ___. I want to drink some water.", options: ['thirsty', 'hungry', 'tired', 'cold'], answer: 0 },
      { q: 'Monday, Tuesday, ___.', options: ['Wednesday', 'Thursday', 'Friday', 'Sunday'], answer: 0 }
    ],
    [ // A2
      { q: 'I need to ___ a room at the hotel.', options: ['book', 'read', 'write', 'take'], answer: 0, explain: '"Book" como verbo significa reservar.' },
      { q: "The shop is ___ on Sundays; you can't buy anything.", options: ['open', 'closed', 'empty', 'free'], answer: 1 },
      { q: 'He ___ the bus because he woke up late.', options: ['lost', 'missed', 'failed', 'left'], answer: 1, explain: 'Perder un transporte es "miss", no "lose".' },
      { q: 'Can you ___ me your pen, please?', options: ['borrow', 'lend', 'give back', 'take'], answer: 1, explain: '"Lend" = prestar a alguien; "borrow" = pedir prestado.' },
      { q: "It's very ___ today; take an umbrella.", options: ['sunny', 'rainy', 'dry', 'hot'], answer: 1 }
    ],
    [ // B1
      { q: 'Can you ___ me up at the station at six?', options: ['take', 'pick', 'bring', 'get'], answer: 1, explain: '"Pick someone up" = recoger a alguien.' },
      { q: 'The meeting was ___ until next week.', options: ['put off', 'put on', 'put up', 'put out'], answer: 0, explain: '"Put off" = aplazar.' },
      { q: "She's very ___; she always tells the truth.", options: ['honest', 'jealous', 'generous', 'ambitious'], answer: 0 },
      { q: "I'm looking ___ to seeing you.", options: ['forward', 'after', 'for', 'up'], answer: 0, explain: '"Look forward to" + -ing = tener ganas de.' },
      { q: 'We need to ___ a decision soon.', options: ['make', 'do', 'take place', 'have done'], answer: 0, explain: 'Colocación: "make a decision".' }
    ],
    [ // B2
      { q: 'The company decided to ___ 200 jobs.', options: ['cut', 'reduce down', 'lower', 'shorten'], answer: 0, explain: 'Colocación: "cut jobs".' },
      { q: "His argument doesn't ___ water.", options: ['hold', 'keep', 'carry', 'take'], answer: 0, explain: '"Hold water" = ser convincente, sostenerse.' },
      { q: 'The new policy had a significant ___ on sales.', options: ['impact', 'effect to', 'affect', 'influence to'], answer: 0 },
      { q: 'She ___ a lot of money from her grandmother.', options: ['inherited', 'inhabited', 'earned off', 'heritaged'], answer: 0 },
      { q: 'The concert was cancelled ___ the bad weather.', options: ['due to', 'because', 'despite', 'although'], answer: 0, explain: '"Due to" + sustantivo; "because" necesitaría "of".' }
    ],
    [ // C1
      { q: 'The results were ___; no clear conclusion could be drawn.', options: ['inconclusive', 'incoherent', 'insignificant', 'indifferent'], answer: 0 },
      { q: 'The minister tried to ___ the criticism by announcing new funding.', options: ['deflect', 'reflect', 'inflict', 'defer'], answer: 0, explain: '"Deflect criticism" = desviar las críticas.' },
      { q: "It's a ___ conclusion that prices will rise.", options: ['foregone', 'forgone', 'forecast', 'foreseen'], answer: 0, explain: '"A foregone conclusion" = algo que se da por hecho.' },
      { q: 'The scandal ___ his reputation.', options: ['tarnished', 'varnished', 'furnished', 'garnished'], answer: 0 },
      { q: "Let's not ___ around the bush; tell me what happened.", options: ['beat', 'hit', 'walk', 'run'], answer: 0, explain: '"Beat around the bush" = andarse con rodeos.' }
    ],
    [ // C2
      { q: 'His speech was full of ___ remarks that offended nobody but convinced nobody either.', options: ['anodyne', 'acerbic', 'incisive', 'vitriolic'], answer: 0 },
      { q: "The detective's ___ eye noticed every detail.", options: ['perspicacious', 'gregarious', 'obsequious', 'capricious'], answer: 0 },
      { q: 'The negotiations reached an ___ and were suspended.', options: ['impasse', 'impetus', 'imposition', 'impunity'], answer: 0 },
      { q: 'Her ___ manner made everyone feel instantly at ease.', options: ['affable', 'irascible', 'laconic', 'truculent'], answer: 0 },
      { q: "The author's ___ prose is a joy to read.", options: ['mellifluous', 'cacophonous', 'turgid', 'prolix'], answer: 0 }
    ]
  ],

  reading: [
    { // A1
      title: 'About me',
      text: "Hi! My name is Tom. I am 25 years old and I live in London with my sister, Anna. I work in a café. I start work at 7 o'clock in the morning. In the evening I play football with my friends. On Saturdays Anna and I visit our parents.",
      questions: [
        { q: 'Where does Tom live?', options: ['Paris', 'London', 'Madrid', 'New York'], answer: 1 },
        { q: "What is Tom's job?", options: ['He works in a café', 'He is a teacher', 'He is a football player', 'He works in a shop'], answer: 0 },
        { q: 'What does Tom do on Saturdays?', options: ['He plays football', 'He visits his parents', 'He works', 'He studies'], answer: 1 }
      ]
    },
    { // A2
      title: 'An email from Kate',
      text: "Dear Sarah,\nThanks for your message. I'm sorry I couldn't come to your party last Friday. I had a bad cold and stayed in bed all weekend. I'm feeling much better now. Are you free next Wednesday? There's a new Italian restaurant near the station and I'd love to try it. I can book a table for 8 pm. Let me know!\nLove, Kate",
      questions: [
        { q: "Why didn't Kate go to the party?", options: ['She was working', 'She was ill', 'She forgot', 'She was travelling'], answer: 1 },
        { q: 'What does Kate want to do next Wednesday?', options: ['Go to a party', 'Eat at a restaurant', 'Visit the station', 'Stay at home'], answer: 1 },
        { q: 'What will Kate do if Sarah agrees?', options: ['Cook dinner', 'Book a table', 'Buy a train ticket', 'Call the restaurant owner'], answer: 1 }
      ]
    },
    { // B1
      title: 'Working from home',
      text: 'Many people believe that working from home is always more relaxing than working in an office. However, a recent survey of 2,000 employees found that the reality is more complicated. While 70% said they enjoyed not having to commute, almost half admitted that they found it harder to stop working in the evening. Some also missed the informal conversations with colleagues that often lead to new ideas. The researchers concluded that the best option for most people seems to be a mix: two or three days at home and the rest in the office.',
      questions: [
        { q: 'What did most employees like about working from home?', options: ['Earning more money', 'Not travelling to work', 'Working fewer hours', 'Having more meetings'], answer: 1 },
        { q: 'What problem did almost half of the employees mention?', options: ['Feeling lonely at weekends', 'Difficulty finishing work in the evening', 'A poor internet connection', 'Too many emails'], answer: 1 },
        { q: 'What did the researchers recommend?', options: ['Working only from home', 'Working only in the office', 'A combination of both', 'Changing jobs'], answer: 2 }
      ]
    },
    { // B2
      title: 'Bees on the rooftops',
      text: 'Urban beekeeping has grown rapidly over the past decade, with rooftop hives now common in cities such as London, Paris and New York. Supporters argue that it helps reverse the decline of bee populations and reconnects city dwellers with nature. Yet some ecologists are sceptical. They point out that honeybees are domesticated animals and that adding large numbers of them to cities may actually harm wild bee species, which compete for the same limited supply of flowers. In their view, planting more native flowers would do far more for biodiversity than installing additional hives.',
      questions: [
        { q: 'What is the main point of the text?', options: ['Urban beekeeping is banned in many cities', 'Urban beekeeping may not help biodiversity as much as people think', 'Honeybees are dying because of pollution', 'City dwellers dislike bees'], answer: 1 },
        { q: 'Why are some ecologists sceptical?', options: ['Honeybees may compete with wild bees for food', 'Hives are dangerous for people', 'Rooftops are too cold for bees', 'Honey from cities is unsafe'], answer: 0 },
        { q: 'The word "sceptical" is closest in meaning to:', options: ['doubtful', 'enthusiastic', 'angry', 'uninformed'], answer: 0 }
      ]
    },
    { // C1
      title: 'The multitasking myth',
      text: 'The notion that multitasking makes us more productive has proved remarkably resilient, despite mounting evidence to the contrary. Studies consistently show that what we call multitasking is in fact rapid task-switching, and each switch carries a cognitive cost: attention must be disengaged from one task and reoriented to another, a process that can consume as much as 40% of productive time. Paradoxically, those who multitask most frequently tend to rate themselves as best at it, while performing worst on objective measures. This disconnect suggests that the perceived benefits of multitasking may owe more to the pleasant sense of busyness it generates than to any genuine gain in output.',
      questions: [
        { q: 'According to the text, multitasking is essentially:', options: ['doing several things at once with no loss', 'switching quickly between tasks', 'a skill that improves with practice', 'a myth invented by researchers'], answer: 1 },
        { q: 'What is paradoxical about frequent multitaskers?', options: ['They are the most productive', 'They overestimate their ability', 'They avoid multitasking at work', 'They rarely feel busy'], answer: 1 },
        { q: 'The author implies that people keep multitasking because:', options: ['it genuinely increases output', 'it makes them feel productive', 'employers require it', 'it reduces stress'], answer: 1 }
      ]
    },
    { // C2
      title: 'Spiritualism and the telegraph',
      text: 'It would be facile to dismiss the nineteenth-century vogue for spiritualism as mere credulity. For many of its adherents, séances offered not an escape from reason but an extension of it: in an age when telegraphy had made it possible to communicate instantaneously across oceans, the idea that one might converse with the dead seemed less a leap of faith than a plausible next step in the march of technology. That the movement attracted eminent scientists as well as the bereaved and the gullible is thus less paradoxical than it first appears; it reflects an epistemological climate in which the boundary between the empirically demonstrable and the merely conceivable was itself in flux.',
      questions: [
        { q: "The author considers dismissing spiritualism as credulity to be:", options: ['justified', 'overly simplistic', 'historically accurate', 'morally wrong'], answer: 1 },
        { q: 'Why does the author mention the telegraph?', options: ['To show that spiritualists opposed technology', 'To explain why contact with the dead seemed plausible', 'To argue that séances used telegraph equipment', 'To criticise Victorian scientists'], answer: 1 },
        { q: '"In flux" in the final sentence most nearly means:', options: ['clearly defined', 'constantly changing', 'firmly rejected', 'widely ignored'], answer: 1 }
      ]
    }
  ],

  listening: [
    { // A1
      title: 'Supermarket announcement', rate: 0.8,
      script: "Good morning. Welcome to Green Street Supermarket. Today, apples are on offer: one kilo for two pounds. The shop closes at nine o'clock tonight. Thank you for shopping with us.",
      questions: [
        { q: 'Where is the announcement?', options: ['At a supermarket', 'At a school', 'At a train station', 'At a hospital'], answer: 0 },
        { q: 'How much is a kilo of apples?', options: ['£1', '£2', '£9', '£12'], answer: 1 },
        { q: 'When does the shop close?', options: ["7 o'clock", "8 o'clock", "9 o'clock", "10 o'clock"], answer: 2 }
      ]
    },
    { // A2
      title: 'A phone message', rate: 0.85,
      script: "Hi Mark, it's Lucy. I'm calling about Saturday. I'm afraid I can't meet you at the museum at ten, because I have to take my brother to the dentist. Can we meet at twelve instead, at the café next to the museum? Call me back when you get this message. Bye!",
      questions: [
        { q: 'Why is Lucy calling?', options: ['To change the meeting time', 'To cancel the plan completely', 'To invite Mark to the dentist', 'To ask for directions'], answer: 0 },
        { q: 'What does Lucy have to do on Saturday morning?', options: ['Work at the museum', 'Take her brother to the dentist', 'Visit her grandmother', 'Go shopping'], answer: 1 },
        { q: 'Where does Lucy want to meet?', options: ['At the museum entrance', 'At the dentist', 'At the café next to the museum', "At Mark's house"], answer: 2 }
      ]
    },
    { // B1
      title: 'Station announcement', rate: 0.92,
      script: 'Attention, please. This is an announcement for passengers travelling on the fourteen thirty-five train to Manchester. Due to engineering works, this service will depart from platform nine instead of platform four. The train is also expected to be approximately twenty minutes late. Passengers with connecting trains should speak to a member of staff at the information desk. We apologise for any inconvenience.',
      questions: [
        { q: 'What has changed about the train to Manchester?', options: ['Its destination', 'Its platform and departure time', 'Its price', 'It has been cancelled'], answer: 1 },
        { q: 'Why has this happened?', options: ['Bad weather', 'Engineering works', 'A strike', 'An accident'], answer: 1 },
        { q: 'What should passengers with connections do?', options: ['Take a bus', 'Wait on platform four', 'Speak to staff at the information desk', 'Buy a new ticket'], answer: 2 }
      ]
    },
    { // B2
      title: 'Podcast: sleep', rate: 1.0,
      script: "In today's episode we're looking at sleep. Most adults need between seven and nine hours a night, yet surveys suggest that around a third of us regularly get less than six. The consequences go well beyond feeling tired. Chronic sleep deprivation has been linked to weakened immunity, weight gain and poorer decision-making. Interestingly, experts say that the most effective change isn't sleeping longer at weekends to catch up, but keeping a consistent wake-up time every day, even on Sundays.",
      questions: [
        { q: 'What proportion of people regularly sleep less than six hours?', options: ['About a quarter', 'About a third', 'About half', 'Most adults'], answer: 1 },
        { q: 'Which consequence is NOT mentioned?', options: ['Weakened immunity', 'Weight gain', 'Poorer decision-making', 'Memory loss'], answer: 3 },
        { q: 'What do experts recommend most?', options: ['Sleeping longer at weekends', 'Waking up at the same time every day', 'Taking short naps', 'Going to bed earlier on Sundays'], answer: 1 }
      ]
    },
    { // C1
      title: 'Opinion: AI in education', rate: 1.03,
      script: "What strikes me about the debate on artificial intelligence in education is how polarised it has become. On one side you have evangelists claiming it will personalise learning for every child; on the other, critics warning it will erode students' ability to think for themselves. Both camps, I'd argue, overlook the more mundane reality: the impact will depend far less on the technology itself than on how teachers are trained to integrate it. Without that investment, even the most sophisticated tools are likely to end up as expensive distractions.",
      questions: [
        { q: 'How does the speaker describe the debate?', options: ['Balanced', 'Polarised', 'Outdated', 'Irrelevant'], answer: 1 },
        { q: "What does the speaker believe will determine AI's impact?", options: ['How sophisticated the technology is', 'How teachers are trained to use it', 'Government regulation', "Students' enthusiasm"], answer: 1 },
        { q: "What is the speaker's overall stance?", options: ['Strongly in favour of AI', 'Strongly against AI', 'Pragmatic and cautious', 'Undecided and confused'], answer: 2 }
      ]
    },
    { // C2
      title: 'Lecture: housing policy', rate: 1.08,
      script: 'The irony, of course, is that the very measures introduced to curb speculation in the housing market ended up exacerbating it. By capping the number of new permits, the council inadvertently constrained supply at precisely the moment demand was surging, which, far from cooling prices, sent them spiralling. One might be tempted to attribute this to incompetence, but that would be to ignore the political calculus at play: restricting development was enormously popular with existing homeowners, who, unsurprisingly, constitute the bulk of the electorate.',
      questions: [
        { q: "What was the effect of the council's measures?", options: ['Prices fell sharply', 'Prices rose even further', 'Speculation stopped completely', 'Demand decreased'], answer: 1 },
        { q: 'Why does the speaker reject the idea of simple incompetence?', options: ['The council had expert advisers', 'The policy was popular with voters', 'The measures were never implemented', 'Prices were already falling'], answer: 1 },
        { q: '"Exacerbating" means:', options: ['making worse', 'making illegal', 'measuring', 'ignoring'], answer: 0 }
      ]
    }
  ],

  // Descriptores "puedo..." basados en la escala de autoevaluación del MCER.
  cando: {
    writing: [
      ['Puedo escribir postales cortas y sencillas.', 'Puedo rellenar formularios con mis datos personales (nombre, nacionalidad, dirección).'],
      ['Puedo escribir notas y mensajes breves sobre necesidades inmediatas.', 'Puedo escribir una carta personal muy sencilla, por ejemplo para dar las gracias.'],
      ['Puedo escribir textos sencillos y bien enlazados sobre temas que conozco.', 'Puedo escribir cartas o correos describiendo experiencias e impresiones.'],
      ['Puedo escribir textos claros y detallados sobre una amplia serie de temas.', 'Puedo escribir un ensayo o informe dando razones a favor o en contra de un punto de vista.'],
      ['Puedo escribir textos bien estructurados sobre temas complejos, resaltando las ideas principales.', 'Puedo elegir el estilo adecuado según el lector al que va dirigido el texto.'],
      ['Puedo escribir informes, artículos o reseñas complejas con una estructura lógica y eficaz.', 'Escribo con un estilo fluido y apropiado que ayuda al lector a encontrar los puntos importantes.']
    ],
    speaking: [
      ['Puedo presentarme y decir dónde vivo y a qué me dedico.', 'Puedo hacer y responder preguntas sencillas sobre temas muy cotidianos si me hablan despacio.'],
      ['Puedo describir con frases sencillas a mi familia, mi rutina o mi trabajo.', 'Puedo pedir comida, comprar billetes o preguntar cómo llegar a un sitio.'],
      ['Puedo contar una experiencia, el argumento de una película o un libro, y dar mi opinión.', 'Puedo desenvolverme en casi todas las situaciones que surgen al viajar.'],
      ['Puedo conversar con nativos con fluidez y naturalidad suficientes para que no sea un esfuerzo para nadie.', 'Puedo explicar mi punto de vista sobre un tema dando ventajas y desventajas.'],
      ['Me expreso con fluidez y espontaneidad sin tener que buscar las palabras de forma evidente.', 'Uso el idioma con eficacia en contextos sociales y profesionales.'],
      ['Participo sin esfuerzo en cualquier conversación y conozco bien expresiones idiomáticas y coloquiales.', 'Puedo transmitir matices sutiles de significado con precisión y reformular sin que se note.']
    ]
  },

  diagnosticWritingPrompt: 'Write about a place you would like to visit and explain why. Include what you would do there and who you would go with. (80–150 words)',

  writingPrompts: [
    ['Write a short message to a new friend. Say your name, age, where you live and what you like. (30–50 words)', 'Describe your bedroom or your house. (30–50 words)'],
    ['Write an email to a friend about your last weekend. What did you do? Did you enjoy it? (50–80 words)', 'Write a note to a colleague: you can\'t come to a meeting. Explain why and suggest another day. (40–60 words)'],
    ['Write a review of a film or series you watched recently. Say what it is about and why you would or wouldn\'t recommend it. (100–150 words)', 'Write an email to a hotel to complain about a problem during your stay and ask for a solution. (100–150 words)'],
    ['Write an essay: "Social media does more harm than good." Give arguments for and against and your own conclusion. (150–220 words)', 'Write a formal email applying for a job you would like. Explain your experience and why you are suitable. (150–200 words)'],
    ['Write a report for your manager evaluating the advantages and drawbacks of a four-day working week, with recommendations. (220–280 words)', 'Write an article for a magazine about how technology has changed the way we learn. (220–280 words)'],
    ['Write a critical review of a book, exhibition or public policy, weighing its strengths and weaknesses for an informed audience. (280–350 words)', 'Write an opinion column arguing a nuanced position on whether cities should ban private cars from their centres. (280–350 words)']
  ],

  speakingPrompts: [
    ['Introduce yourself: your name, where you are from, your job or studies, and your hobbies.', 'Describe your family.'],
    ['Describe a typical day in your life, from morning to night.', 'Talk about your last holiday: where you went, what you did and what you liked.'],
    ['Talk about a person who has influenced you and explain why.', 'Describe a problem you had and how you solved it.'],
    ['Do you think people should work from home? Give advantages and disadvantages and your opinion.', 'Describe a change in your city in recent years and evaluate whether it was positive.'],
    ['To what extent should governments regulate artificial intelligence? Develop a balanced argument.', 'Describe a professional challenge you faced, what you learnt and what you would do differently.'],
    ['"Progress is impossible without change." Discuss, drawing on examples from history, science or your own experience.', 'Explain a complex topic you know well to a non-expert audience, using analogies.']
  ],

  shadowing: [
    ['Hello, my name is Ana. Nice to meet you.', 'I live in a small flat near the city centre.', 'What time is it, please?'],
    ['I usually get up at seven and have breakfast at home.', 'Could you tell me where the nearest bank is?', 'Last weekend we went to the beach with some friends.'],
    ["I've been learning English for about three years now.", 'If I have time tomorrow, I\'ll call you after work.', "I'm not sure I agree, but I see what you mean."],
    ["Had I known it would rain, I'd have brought an umbrella.", 'The main advantage is flexibility, although it can be isolating.', "It's not so much the price that worries me as the quality."],
    ["Admittedly, the proposal has its merits, but it doesn't address the underlying issue.", 'No sooner had we arrived than the meeting was called off.', "What I'm getting at is that we need a more nuanced approach."],
    ['Far from being a setback, the delay afforded us the opportunity to reconsider our strategy.', 'Were it not for her intervention, the negotiations would have collapsed entirely.', 'The argument, compelling as it may seem, rests on a number of questionable assumptions.']
  ],

  // Actividades sugeridas por destreza y franja (A = básico, B = independiente, C = competente).
  activities: {
    reading: {
      A: ['Lee un graded reader de nivel 1–2 (Oxford Bookworms, Penguin Readers) 15 min y anota 5 palabras nuevas.', 'Lee una noticia en "News in Levels" (nivel 1–2) y resume en una frase.', 'Haz la práctica de Lectura en la app y relee el texto en voz alta.'],
      B: ['Lee un artículo de BBC Learning English o VOA Learning English y escribe 3 ideas principales.', 'Lee un capítulo de un graded reader de nivel 3–4 sin diccionario; luego comprueba 5 palabras.', 'Haz la práctica de Lectura en la app y subraya los conectores del texto.'],
      C: ['Lee un artículo de opinión (The Guardian, The Economist) e identifica la tesis y los argumentos.', 'Lee 20 páginas de una novela o ensayo original y anota expresiones idiomáticas.', 'Haz la práctica de Lectura en la app y parafrasea cada párrafo en una frase.']
    },
    listening: {
      A: ['Escucha un episodio corto para principiantes (p. ej. "6 Minute English" o "ESL Pod") con transcripción.', 'Ve un vídeo corto con subtítulos en inglés y repite las frases clave.', 'Haz la práctica de Escucha en la app a velocidad 0,8 y luego a 1.'],
      B: ['Escucha un episodio de "6 Minute English" (BBC) dos veces: sin y con transcripción.', 'Ve un capítulo de una serie con subtítulos en inglés y anota 5 expresiones.', 'Haz la práctica de Escucha en la app sin mirar el texto y comprueba después.'],
      C: ['Escucha una charla TED o un podcast nativo y toma notas de los argumentos.', 'Ve un programa o película sin subtítulos; luego revisa una escena con subtítulos.', 'Haz la práctica de Escucha en la app a velocidad 1,1 y transcribe una frase.']
    },
    grammar: {
      A: ['Repasa una estructura (to be, presente simple, pasado) y escribe 5 frases propias.', 'Haz la práctica de Gramática en la app y revisa las explicaciones de los fallos.', 'Usa "English Grammar in Use – Elementary" (Murphy): una unidad.'],
      B: ['Estudia una unidad de "English Grammar in Use" (Murphy) y haz sus ejercicios.', 'Haz la práctica de Gramática en la app y crea un ejemplo propio por cada fallo.', 'Transforma 5 frases de activa a pasiva o a estilo indirecto.'],
      C: ['Estudia una unidad de "Advanced Grammar in Use" (inversión, condicionales mixtos, cleft sentences).', 'Haz la práctica de Gramática en la app y explica cada respuesta en voz alta.', 'Reescribe un párrafo propio usando 3 estructuras avanzadas.']
    },
    vocabulary: {
      A: ['Aprende 10 palabras de un tema (comida, familia, ciudad) con tarjetas (Anki/Quizlet).', 'Haz la práctica de Vocabulario en la app y escribe una frase con cada palabra fallada.', 'Etiqueta 10 objetos de tu casa en inglés.'],
      B: ['Aprende 10 colocaciones o phrasal verbs y úsalos en frases propias.', 'Haz la práctica de Vocabulario en la app y repasa tus tarjetas de repetición espaciada.', 'Usa "English Vocabulary in Use – Intermediate": una unidad.'],
      C: ['Recoge 10 expresiones idiomáticas de tus lecturas y busca ejemplos en un corpus o diccionario (Cambridge, Oxford Learner\'s).', 'Haz la práctica de Vocabulario en la app y busca sinónimos con distinto registro.', 'Usa "English Vocabulary in Use – Advanced": una unidad.']
    },
    writing: {
      A: ['Escribe 5 frases sobre tu día y revísalas con la app (Escritura).', 'Escribe un mensaje corto a un amigo imaginario siguiendo una consigna de la app.', 'Copia y adapta un texto modelo cambiando los datos personales.'],
      B: ['Escribe 120–150 palabras con una consigna de la app y revisa conectores y longitud de frase.', 'Escribe un diario breve (5–8 líneas) usando el tiempo verbal de la semana.', 'Reescribe un texto tuyo antiguo corrigiendo los errores que ahora detectas.'],
      C: ['Escribe un ensayo o informe de 250+ palabras con una consigna de la app.', 'Resume un artículo largo en 100 palabras manteniendo el registro formal.', 'Reescribe un párrafo en dos registros: formal y coloquial.']
    },
    speaking: {
      A: ['Haz shadowing en la app: escucha y repite las frases de tu nivel 3 veces.', 'Grábate 1 minuto presentándote y escúchate.', 'Lee en voz alta un texto corto cuidando la pronunciación.'],
      B: ['Habla 2 minutos sobre una consigna de la app con temporizador y grábate.', 'Haz shadowing en la app y luego di la frase sin el audio.', 'Ten una conversación de 15 min en un intercambio (Tandem, HelloTalk) o con un tutor.'],
      C: ['Prepara y graba una mini-presentación de 3 minutos sobre un tema complejo.', 'Debate un tema con un tutor o compañero y argumenta la postura contraria.', 'Haz shadowing en la app de las frases de nivel C imitando entonación y ritmo.']
    }
  }
};
