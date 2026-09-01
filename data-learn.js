// The rules library: the booklet's teaching, in this app's own words, in play order.
//
// Chapters that name `cards` pull their entries from data.js through one lookup, so a card's
// guidance and examples live in exactly one place (CLAUDE.md §10.2, §10.16).

export const DRAWING_TIPS = [
  {
    n: 1,
    title: 'Do not try to make it perfect',
    text: 'Nothing comes out right the first time — not a story, not a drawing. Sketch loosely and let the pencil run without thinking. Then look at what you have, find the bit you like best, and build the real drawing from there.',
  },
  {
    n: 2,
    title: 'A good order to work in',
    text: 'Pencil first, freely, rubbing out and redoing until you are happy. Then go over the edges with a marker to make them definite — you can change small things as you do. Colour last. And do not worry about going outside the lines.',
  },
  {
    n: 3,
    title: 'Copy what you like',
    text: 'The fastest way to get better is to copy things you admire. Every card in this deck is drawn in a deliberately different style for exactly that reason: take one you like, or borrow its colours, or its layout, or mix details from several.',
  },
  {
    n: 4,
    title: 'Draw your characters so they are recognisable',
    text: 'Push whatever makes them them — a big nose, a slouch, a particular coat. Give each one a colour or two and use the same ones every time you draw them. Try opposites: rounded shapes for the hero, spikes and triangles for the villain.',
  },
  {
    n: 5,
    title: 'Make objects matter',
    text: 'Objects carry stories. Make a magic one shine with rays or marks around it, or draw it far bigger or smaller than it should be. To bring one to life, find the human bits it already has: a tree has arms of branches and hair of leaves. Add eyes and a mouth and it can see and speak.',
  },
  {
    n: 6,
    title: 'Draw the story poster',
    text: 'Fold a sheet in half the long way. Main character on the left, antagonist on the right, each big enough to fill their half, with everything that makes them who they are. Then fill in the background with the world they live in — one world, or a different one for each of them. Add sidekicks, magic objects, powers.',
  },
  {
    n: 7,
    title: 'Draw the story as a comic',
    text: 'Pick one moment — the central trial is a good one, or the moment the hero fails — and draw the characters doing something to each other. Go for maximum tension. Draw several moments and keep the faces, colours and shapes consistent between them, and you have made a comic.',
  },
];

export const LEARN_CHAPTERS = [
  {
    id: 'how-it-works',
    title: 'How this works',
    entries: [
      {
        id: 'what-is-this',
        title: 'What Story Machine is',
        text: 'It runs a card game called Fabula for Kids, which is a machine for inventing stories. You find an idea, decide who is in it and where it happens, lay out what happens in nine beats, and then go back over it with ten questions that make it better. At the end you read the whole thing back.',
      },
      {
        id: 'nothing-is-required',
        title: 'Nothing here is compulsory',
        text: 'You can skip any card, leave any question blank, come back later, use a card twice, or read your story at any point even if half of it is empty. The app counts what you have written so you can see it — it never blocks you and it never says your story is unfinished.',
      },
      {
        id: 'where-it-is-saved',
        title: 'Where your stories are kept',
        text: 'On this device, in this browser, and nowhere else. Nothing is sent anywhere and nobody else can read them. That also means clearing your browser data would clear them, so use "Save a backup file" in Settings if a story matters to you.',
      },
    ],
  },
  {
    id: 'steps',
    title: 'The five steps',
    entries: [
      { id: 'step-idea', title: '1. The idea', text: 'One sentence about what the story is. It is the heart of the thing, and everything else grows around it. If nothing comes, roll the die: each face points at a Prompt card that suggests a kind of story. Roll as often as you like — the book is clear that a bad prompt just means roll again.' },
      { id: 'step-ingredients', title: '2. The ingredients', text: 'Four cards: a main character, an antagonist, the world it happens in, and the something that happens to start it all. Answer them in any order. You can have two heroes, two villains or two worlds if the story wants them.' },
      { id: 'step-structure', title: '3. The structure', text: 'Nine beats, in the order most stories go: ordinary life, the thing that changes it, setting off, two trials, the big confrontation, what came of it, one last twist, and the ending. Write them in any order you like.' },
      { id: 'step-boost', title: '4. The boosts', text: 'Ten questions about the details that make a story worth listening to: who the characters love, why the villain is like that, what the hero is bad at. Some of them will invent whole new characters, and some will send you back to rewrite a beat. That is exactly what they are for.' },
      { id: 'step-tell', title: '5. Tell it', text: 'Read the story back — out loud is best. The app keeps the draft you had before you started boosting, so you can read both and see what the boosts did. Print it or save it as text if you want to keep it somewhere else.' },
    ],
  },
  { id: 'prompts', title: 'The six prompt cards', cards: ['prompt-p', 'prompt-m', 'prompt-q', 'prompt-g', 'prompt-n', 'prompt-s'] },
  { id: 'ingredients', title: 'The four ingredient cards', cards: ['ing-hero', 'ing-villain', 'ing-world', 'ing-event'] },
  { id: 'beats', title: 'The nine beats', cards: ['beat-1', 'beat-2', 'beat-3', 'beat-4', 'beat-5', 'beat-6', 'beat-7', 'beat-8', 'beat-9'] },
  { id: 'boosts', title: 'The ten boost cards', cards: ['boost-care', 'boost-help', 'boost-why-villain', 'boost-too-easy', 'boost-twist', 'boost-background', 'boost-narrator', 'boost-despair', 'boost-faults', 'boost-learn'] },
  {
    id: 'drawing',
    title: 'Drawing your story',
    intro: 'The book ends by handing you paper and pencils, with seven pieces of advice from Matteo Ufocinque, who drew the cards. Story Machine does not draw — this is the part you do away from the screen.',
    tips: true,
  },
];
