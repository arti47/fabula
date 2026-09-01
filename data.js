// The deck: Fabula Deck for Kids (Sefirot, 2021).
//
// Card headlines and the printed Ingredient questions are verbatim from the card faces
// (docs/card-inventory.md). Everything else — guidance, examples — is paraphrased from the
// booklet in this app's own voice; no booklet prose is reproduced.
//
// Examples marked `house: true` are this project's additions, not Sefirot's (CLAUDE.md D7/§2.2),
// and the UI labels them as such.
//
// Art ids resolve to assets/cards/<art>.webp, which is gitignored and generated locally by
// tools/extract-cards.py. Any missing face renders as a labelled placeholder.

export const GROUPS = {
  prompt: { id: 'prompt', name: 'Prompts', badge: 'die', colorVar: '--group-prompt' },
  idea: { id: 'idea', name: 'The Idea', badge: 'hat', colorVar: '--group-idea' },
  ingredient: { id: 'ingredient', name: 'Ingredients', badge: 'flask', colorVar: '--group-ingredient' },
  structure: { id: 'structure', name: 'Structure', badge: 'number', colorVar: '--group-structure' },
  boost: { id: 'boost', name: 'Boosts', badge: 'magnifier', colorVar: '--group-boost' },
};

// Ruling A3: the EN print's Structure divider is untranslated.
export const CARD_ERRATA = [
  {
    id: 'E1',
    card: 'divider-structure',
    printed: 'STRUTTURA',
    app: 'Structure',
    note: 'Untranslated in the English printing of the deck. The app uses Structure everywhere.',
  },
];

// ---------------------------------------------------------------------------
// The Idea card
// ---------------------------------------------------------------------------

export const IDEA_CARD = {
  id: 'idea',
  group: 'idea',
  art: 'idea',
  headline: 'What story do we want to tell?',
  guidance:
    'The idea is the heart of your story — one sentence, and everything else grows around it. ' +
    'It can be very short. If you already have one, say it out loud and get going. ' +
    'If you have not, that is the fun part: roll the die and let a Prompt card hand you one.',
  examples: [
    { ref: 'The Little Mermaid', text: 'a girl who lives at the bottom of the sea wants to know what it is like up on the surface' },
    { ref: 'Kung Fu Panda', text: 'a panda wants to learn kung fu' },
    { ref: 'Alice in Wonderland', text: 'a girl falls into a fantasy world' },
  ],
  starter: 'I want to tell the story of…',
};

// ---------------------------------------------------------------------------
// Prompt cards — one per die face (T1)
// ---------------------------------------------------------------------------

export const PROMPTS = [
  {
    id: 'prompt-p',
    group: 'prompt',
    art: 'prompt-p',
    letter: 'P',
    headline: 'Your main character is what you like most',
    guidance:
      'What is your favourite thing? Imagine it coming alive and having adventures — or make a hero ' +
      'who wants that exact thing more than anything else.',
    examples: [
      { ref: 'Toy Story', text: 'the toys come to life' },
      { ref: 'Kung Fu Panda', text: 'the hero wants to learn kung fu — maybe the director was mad about kung fu' },
      { ref: 'Wreck-It Ralph', text: 'the arcade games somebody loves are a whole world of their own', house: true },
    ],
  },
  {
    id: 'prompt-m',
    group: 'prompt',
    art: 'prompt-m',
    letter: 'M',
    headline: 'Start with a magic object',
    guidance:
      'Invent one impossible object and let the story grow out of it. What is it? What can it do? ' +
      'What does it cost the person holding it?',
    examples: [
      { ref: 'Aladdin', text: 'a lamp with a genie inside' },
      { ref: 'The Sword in the Stone', text: 'a sword nobody can pull out of the anvil' },
      { ref: 'The Lord of the Rings', text: 'the whole story turns on one ring' },
    ],
  },
  {
    id: 'prompt-q',
    group: 'prompt',
    art: 'prompt-q',
    letter: 'Q',
    headline: 'Your character sets off to find something',
    guidance:
      'Something has been stolen, someone has to be saved, or a place is out there worth reaching. ' +
      'Send your character out of their world and into another one — that is a story that almost tells itself.',
    examples: [
      { ref: 'Little Red Riding Hood', text: 'she sets off through the forest to reach Grandma' },
      { ref: 'Pinocchio', text: 'the puppet leaves home to find his own adventure' },
      { ref: 'Frozen', text: 'Anna goes searching for her sister Elsa' },
      { ref: 'pirate stories', text: 'the crew follows the captain after a lost treasure' },
    ],
  },
  {
    id: 'prompt-g',
    group: 'prompt',
    art: 'prompt-g',
    letter: 'G',
    headline: 'Choose the genre: adventure, fantasy, horror, western, space…',
    guidance:
      'Pick the kind of story you most like reading or watching, and the world half-builds itself. ' +
      'Each genre comes with its own furniture: spaceships, spellbooks, saloons, monsters.',
    examples: [
      { ref: 'Star Wars, Star Trek', text: 'space, ships, far futures' },
      { ref: 'Dracula, mummies', text: 'horror, and something in the dark' },
      { ref: 'Harry Potter', text: 'a hidden world of magic inside this one' },
      { ref: 'Robin Hood', text: 'a medieval saga' },
      { ref: 'Coraline', text: 'horror that stays quiet and wrong rather than loud', house: true },
      { ref: 'Encanto', text: 'ordinary family life with magic running through it', house: true },
    ],
  },
  {
    id: 'prompt-n',
    group: 'prompt',
    art: 'prompt-n',
    letter: 'N',
    headline: 'Your main character is not a person',
    guidance:
      'Who says the hero has to be human? An animal, an alien, a tree, a fork. Look around the room ' +
      'and pick something — then work out what it wants.',
    examples: [
      { ref: 'The Ugly Duckling', text: 'a swan who does not know he is one' },
      { ref: 'Paddington', text: 'a talking bear' },
      { ref: 'Cars', text: 'the hero is a racing car' },
      { ref: 'Alice in Wonderland', text: 'a rabbit in a waistcoat, in a hurry' },
      { ref: 'Inside Out', text: 'the characters are somebody’s own emotions', house: true },
      { ref: 'Turning Red', text: 'the hero turns into an enormous red panda', house: true },
    ],
  },
  {
    id: 'prompt-s',
    group: 'prompt',
    art: 'prompt-s',
    letter: 'S',
    headline: 'Does anyone have a special power?',
    guidance:
      'Give somebody one impossible ability, then ask the more interesting question: what does it stop ' +
      'them doing? Invisibility, flight, super strength, reading minds — pick one and live with it.',
    examples: [
      { ref: 'Superman', text: 'what would your hero do if they could fly' },
      { ref: 'Spider-Man', text: 'walking up walls changes every chase' },
      { ref: 'Spider-Verse', text: 'more than one person has the same power, and none of them agree', house: true },
    ],
  },
];

export const DIE_FACES = PROMPTS.map((p) => p.letter); // A4: P M Q G N S

// ---------------------------------------------------------------------------
// Ingredient cards (T3) — questions verbatim from the card faces
// ---------------------------------------------------------------------------

const CHARACTER_QUESTIONS = [
  { key: 'age', label: 'How old are they?', hint: 'Older or younger than you?' },
  { key: 'looks', label: 'What do they look like?', hint: 'Try to describe them.' },
  { key: 'special', label: 'What makes them special?', hint: 'Anything extraordinary? Odd tastes or habits?' },
  { key: 'fear', label: 'Are they afraid of anything?', hint: 'Something that terrifies them, or that they cannot stand.' },
  { key: 'want', label: 'What do they want?', hint: 'The most important thing in the world to them.' },
  { key: 'name', label: 'What are they called?', hint: 'A name, or what everyone calls them.' },
];

export const INGREDIENTS = [
  {
    id: 'ing-hero',
    group: 'ingredient',
    art: 'ing-hero',
    kind: 'hero',
    repeatable: true,
    headline: 'Main character',
    guidance:
      'This is the hero of your story — or the heroes, if you want more than one. ' +
      'Answer what you can and leave the rest blank; you can come back.',
    questions: CHARACTER_QUESTIONS,
    example: {
      ref: 'Little Red Riding Hood',
      answers: {
        age: 'About ten.',
        looks: 'A girl who always wears the red hood her grandmother gave her.',
        special: 'An ordinary child — brave, and a bit disobedient.',
        fear: 'She does not seem frightened of anything. Not even the Wolf.',
        want: 'To get to Grandma and spend time with her.',
        name: 'Everyone calls her Little Red Riding Hood.',
      },
    },
  },
  {
    id: 'ing-villain',
    group: 'ingredient',
    art: 'ing-villain',
    kind: 'villain',
    repeatable: true,
    headline: 'Antagonist',
    guidance:
      'Every story has something to push against. It does not have to be a fight, or even a person — ' +
      'it can be a rival, an obstacle, or a feeling. In The Ugly Duckling the enemy is the fear of being different.',
    questions: CHARACTER_QUESTIONS,
    example: {
      ref: 'the Wolf',
      answers: {
        age: 'Who knows — older than Little Red Riding Hood, certainly.',
        looks: 'A talking wolf who can disguise himself and look harmless.',
        special: 'He is very good at lying. And very hungry.',
        fear: 'We find out later: he is afraid of the Hunter.',
        want: 'To eat Grandma and Little Red Riding Hood.',
        name: 'Everyone calls him the Wolf.',
      },
    },
  },
  {
    id: 'ing-world',
    group: 'ingredient',
    art: 'ing-world',
    kind: 'world',
    repeatable: true,
    headline: 'World',
    guidance:
      'Where the story happens. A fairy-tale kingdom, a city in the future, a distant empire, or your own back garden. ' +
      'The small details are what make it real — what people eat, how children play.',
    questions: [
      { key: 'special', label: 'Is it special? Why?', hint: 'An ordinary world, or one with something extraordinary in it?' },
      { key: 'whereWhen', label: 'Where and when does the story happen?', hint: 'On earth, in space, near or far? Past, present or future?' },
      { key: 'typicalDay', label: "What's a typical day like there?", hint: 'What does an ordinary person do?' },
      { key: 'peopleDo', label: 'What do people play, eat, do etc.?', hint: 'The smallest details of life there.' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      answers: {
        special: 'The classic fairy-tale world. There is a forest, and the animals talk.',
        whereWhen: 'Never said exactly — a fairy-tale time. The forest, and Grandma living beyond it.',
        typicalDay: 'People go about their business in the village and walk in the forest.',
        peopleDo: 'Children play together, but they are forbidden to stray off the road.',
      },
    },
  },
  {
    id: 'ing-event',
    group: 'ingredient',
    art: 'ing-event',
    kind: 'event',
    repeatable: false,
    headline: 'Something happens',
    guidance:
      'Everything looks normal — and then it does not. One unexpected thing sets the story moving: somebody ' +
      'arrives or leaves, something is found or lost, the world changes. Without it there is no story.',
    questions: [
      { key: 'what', label: 'What happens at the beginning?', hint: 'The strange event that starts everything.' },
      { key: 'goodOrBad', label: 'Is it a positive or negative event?', hint: 'What does it do to the characters and the world?' },
      { key: 'antagonistsFault', label: "Is it the antagonist's fault?", hint: 'Does the villain have anything to do with it?' },
      { key: 'howItChanges', label: 'How does it change the story?', hint: 'What can no longer stay the same?' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      answers: {
        what: 'Grandma falls ill, and Little Red Riding Hood has to cross the forest to reach her.',
        goodOrBad: 'Negative — it leads straight to the Wolf.',
        antagonistsFault: 'No. The Wolf only takes advantage of it.',
        howItChanges: 'She takes the job on willingly, and leaves home.',
      },
    },
    examplesOther: [
      { ref: 'Alice in Wonderland', text: 'Alice meets a white rabbit' },
      { ref: 'Harry Potter', text: 'a letter arrives, delivered by owl' },
      { ref: 'Aladdin', text: 'a beggar boy rubs a lamp and a genie comes out' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Structure cards 1–9 (T4)
// ---------------------------------------------------------------------------

export const BEATS = [
  {
    n: 1,
    id: 'beat-1',
    group: 'structure',
    art: 'beat-1',
    headline: 'Once upon a time',
    beatName: 'Ordinary World',
    guidance:
      'Every story starts with things as they normally are. Show us your main character’s ordinary life ' +
      'before any of it goes wrong — who they are, where they live, what a normal day looks like.',
    examples: [
      { ref: 'Cinderella', text: 'we watch everyone treat her badly' },
      { ref: 'Pinocchio', text: 'Geppetto is carving his puppet' },
      { ref: 'the cards', text: 'a little cottage sleeps next to the tree it loves' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'Once upon a time there was a girl called Little Red Riding Hood, who… (describe her, her habits, where she lives).',
    },
  },
  {
    n: 2,
    id: 'beat-2',
    group: 'structure',
    art: 'beat-2',
    headline: 'And then one day',
    beatName: 'Call to Action',
    guidance:
      'Something happens that sets the whole thing moving. You may already have this from the ' +
      '"Something happens" card — that is why it is waiting here for you.',
    prefillFrom: 'inciting', // ruling A5
    examples: [
      { ref: 'Harry Potter', text: 'the owl and then Hagrid arrive to invite Harry to a school of magic' },
      { ref: 'Spider-Man', text: 'a radioactive spider bites him' },
      { ref: 'the cards', text: 'a dragon arrives and steals the cottage’s tree' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'And then one day her grandmother falls ill, and she has to take her some food.',
    },
  },
  {
    n: 3,
    id: 'beat-3',
    group: 'structure',
    art: 'beat-3',
    headline: 'The adventure begins!',
    beatName: 'The Threshold',
    guidance:
      'Your character decides what to do — and the decision is usually final. This is the moment they step ' +
      'out of their ordinary life and the real adventure starts.',
    examples: [
      { ref: 'The Lord of the Rings', text: 'Frodo leaves home to destroy the ring' },
      { ref: 'Kung Fu Panda', text: 'Po starts his training' },
      { ref: 'the cards', text: 'the cottage sets off after the dragon' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'She sets off into the forest with the food for her grandmother.',
    },
  },
  {
    n: 4,
    id: 'beat-4',
    group: 'structure',
    art: 'beat-4',
    headline: 'But all of a sudden',
    beatName: 'First Trial',
    guidance:
      'It would be dull if the plan simply worked. Put something in the way — a test, an enemy, a feeling ' +
      'they have never had before. They might get past it, or they might fail and have to try again later.',
    examples: [
      { ref: 'The Lion King', text: 'Simba goes to the elephants’ graveyard' },
      { ref: 'Snow White', text: 'she has to survive in the forest' },
      { ref: 'the cards', text: 'the cottage must cross a mountain, and asks the goose with the balloon for help' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'On the way she meets the Wolf, who asks where Grandma lives. She does not recognise him, and tells him.',
    },
  },
  {
    n: 5,
    id: 'beat-5',
    group: 'structure',
    art: 'beat-5',
    headline: 'But all of a sudden',
    beatName: 'Second Trial',
    guidance:
      'Trouble never comes once. Straight after the first obstacle, here is another — and this is a good ' +
      'place for your character to lose, not win.',
    examples: [
      { ref: 'Cinderella', text: 'her stepsisters tear her ball gown to pieces' },
      { ref: 'a horror story', text: 'the werewolf is dealt with, and now there is the mummy' },
      { ref: 'the cards', text: 'the cottage is caught in brambles and attacked by ravens' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'The Wolf stalls her again. She stops to pick flowers, so he reaches Grandma first and swallows her. She has failed this one.',
    },
  },
  {
    n: 6,
    id: 'beat-6',
    group: 'structure',
    art: 'beat-6',
    headline: 'Face-off with the antagonist',
    beatName: 'Central Trial',
    guidance:
      'The hardest thing your character will ever have to do. Usually it is the villain, face to face — but ' +
      'it can be a fear instead: walking through a dark room to save the cat counts, if the dark is the enemy.',
    examples: [
      { ref: 'Frozen', text: 'Anna reaches Elsa’s castle and has to persuade her to come home' },
      { ref: 'Batman', text: 'the henchmen are done with; now the real villain' },
      { ref: 'the cards', text: 'the cottage fights the dragon' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'She arrives at Grandma’s house and talks to the Wolf.',
    },
  },
  {
    n: 7,
    id: 'beat-7',
    group: 'structure',
    art: 'beat-7',
    headline: 'The result is that',
    beatName: 'Outcome',
    guidance:
      'The big test always has consequences. Sometimes the villain loses and the hero is rewarded; sometimes ' +
      'the villain wins and the hero loses something. Both make good stories — losing here often makes a better one.',
    examples: [
      { ref: 'pirate stories', text: 'the giant squid is beaten and the treasure is theirs' },
      { ref: 'Pinocchio', text: 'he cannot resist the land of toys, and turns into a donkey' },
      { ref: 'the cards', text: 'the cottage beats the dragon and gets the tree back' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'She does not recognise the Wolf, fails the central trial, and the result is that he eats her.',
    },
  },
  {
    n: 8,
    id: 'beat-8',
    group: 'structure',
    art: 'beat-8',
    headline: 'But something happens again',
    beatName: 'Relapse',
    guidance:
      'If the story stopped now it would feel unfinished. One more unexpected thing turns the situation over ' +
      'again — a rescue, a betrayal, a change of heart.',
    examples: [
      { ref: 'Frozen', text: 'Anna needs Hans’s kiss to save herself, and he refuses' },
      { ref: 'Cinderella', text: 'she is back to her old life, and the prince knocks with the slipper' },
      { ref: 'the cards', text: 'the ravens attack, and the dragon is sorry — he fights them off for the cottage' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'The Wolf is sleeping off his meal when the Hunter arrives, realises something is wrong, and cuts her out.',
    },
  },
  {
    n: 9,
    id: 'beat-9',
    group: 'structure',
    art: 'beat-9',
    headline: 'In the end',
    beatName: 'Conclusion',
    guidance:
      'The closing act — the happily-ever-after moment, whatever that turns out to be here. Everything settles ' +
      'into a new normal, and your character decides whether to stay in the new world or go home changed.',
    examples: [
      { ref: 'Cinderella', text: 'she becomes a princess and starts a new life' },
      { ref: 'Harry Potter', text: 'he goes back to his aunt and uncle, who treat him better now he is a wizard' },
      { ref: 'the cards', text: 'the cottage goes home with the tree — and a new friend, the dragon' },
    ],
    example: {
      ref: 'Little Red Riding Hood',
      text: 'In the end she learns to listen to her mother and not to dawdle in the forest.',
    },
  },
];

// ---------------------------------------------------------------------------
// Boost cards (T5) — any order, all optional (P8)
// `canSpawn` lists Ingredient kinds this Boost may invent (P6, ruling D17).
// `suggestsBeats` lists beats it most often sends you back to rewrite (P7).
// ---------------------------------------------------------------------------

export const BOOSTS = [
  {
    id: 'boost-care',
    group: 'boost',
    art: 'boost-care',
    headline: 'Who do they care for?',
    guidance:
      'Friends, parents, a brother, someone they are in love with. Everybody loves somebody, and the story ' +
      'gets its weight from what a character stands to lose.',
    canSpawn: ['hero'],
    suggestsBeats: [1],
    examples: [
      { ref: 'Frozen', text: 'Anna loves her sister' },
      { ref: 'Aladdin', text: 'he falls in love with Jasmine' },
      { ref: 'Little Red Riding Hood', text: 'she has her mother and her grandmother' },
    ],
  },
  {
    id: 'boost-help',
    group: 'boost',
    art: 'boost-help',
    headline: 'Do they get enough help?',
    guidance:
      'It may be too hard to manage alone. Heroes almost always meet someone who helps — and villains have ' +
      'helpers too. Adding one is often the single biggest improvement you can make.',
    canSpawn: ['hero', 'villain'],
    suggestsBeats: [4, 5, 8],
    examples: [
      { ref: 'Cinderella', text: 'without the fairy godmother there is no dress and no carriage' },
      { ref: 'Harry Potter', text: 'Hermione and Ron' },
      { ref: 'Pinocchio', text: 'the cricket and the blue fairy' },
      { ref: 'Little Red Riding Hood', text: 'we wait a long time for the Hunter, but she would not have made it without him' },
      { ref: 'Hänsel & Gretel', text: 'this is the card that invents Gretel — Hänsel was alone until now' },
    ],
  },
  {
    id: 'boost-why-villain',
    group: 'boost',
    art: 'boost-why-villain',
    headline: 'Why does the antagonist behave like that?',
    guidance:
      'Why are the bad ones bad? Sometimes they are not, quite — sometimes they are misunderstood, or frightened, ' +
      'or were hurt first. Ask what would happen if your hero and your villain actually got to know each other.',
    canSpawn: ['villain'],
    suggestsBeats: [6, 8],
    examples: [
      { ref: 'Frozen', text: 'Elsa looks evil, but she simply cannot control what she can do' },
      { ref: 'Shrek', text: 'an ogre we would run from if we did not know him' },
      { ref: 'Batman', text: 'the Joker has a background worth knowing' },
      { ref: 'Hänsel & Gretel', text: 'this is the card that invents the stepmother' },
    ],
  },
  {
    id: 'boost-too-easy',
    group: 'boost',
    art: 'boost-too-easy',
    headline: 'Was it too easy?',
    guidance:
      'Make life harder for your characters. The bigger the obstacles, the better the story — pirates who find ' +
      'the treasure straight away, with no shipwreck and no sea monster, are no fun at all.',
    canSpawn: [],
    suggestsBeats: [4, 5, 6],
    examples: [
      { ref: 'The Lord of the Rings', text: 'count how many trials Frodo goes through' },
      { ref: 'Little Red Riding Hood', text: 'if she had recognised the Wolf at once it would be half the story' },
      { ref: 'Hänsel & Gretel', text: 'the parents try to abandon them twice — the pebbles work, the breadcrumbs do not' },
    ],
  },
  {
    id: 'boost-twist',
    group: 'boost',
    art: 'boost-twist',
    headline: 'Have you thought of a plot twist?',
    guidance:
      'Everyone is sure they know what happens next — so surprise them. Someone is not who they seem, or ' +
      'something important only comes out halfway through.',
    canSpawn: [],
    suggestsBeats: [6, 7, 8],
    examples: [
      { ref: 'Frozen', text: 'Hans does not want to kiss Anna at all' },
      { ref: 'a thriller', text: 'the murderer is the one we suspected least' },
      { ref: 'Hänsel & Gretel', text: 'it is Gretel, the younger one, who saves her brother' },
    ],
  },
  {
    id: 'boost-background',
    group: 'boost',
    art: 'boost-background',
    headline: "Have you thought about the characters' background?",
    guidance:
      'Everyone has a past, even when the story never tells it — and what happened before decides what they do now. ' +
      'The side characters have one too, and that is often where your next story is hiding.',
    canSpawn: [],
    suggestsBeats: [1],
    examples: [
      { ref: 'Harry Potter', text: 'his scar is the mark of meeting Voldemort as a baby' },
      { ref: 'Robin Hood', text: 'a thief who started stealing to answer an injustice' },
      { ref: 'Hänsel & Gretel', text: 'the family is so poor there is nothing to eat — that is why the children are abandoned' },
    ],
  },
  {
    id: 'boost-narrator',
    group: 'boost',
    art: 'boost-narrator',
    headline: 'Who tells the story?',
    guidance:
      'Every story has a voice telling it. It can be one of the characters, a witness, or someone who heard it ' +
      'from somebody else — and it can be told as happening now, or long ago.',
    canSpawn: [],
    suggestsBeats: [],
    examples: [
      { ref: 'The NeverEnding Story', text: 'the hero tells us about the world he lives in' },
      { ref: 'a thriller', text: 'usually the detective narrates' },
      { ref: 'Little Red Riding Hood', text: 'an outside narrator, in the past. Imagine it told by Grandma instead' },
    ],
  },
  {
    id: 'boost-despair',
    group: 'boost',
    art: 'boost-despair',
    headline: 'Is there a moment of despair?',
    guidance:
      'Let your character fall, and all hope go. When they get back up they are stronger, and everyone listening ' +
      'cares far more than they did before.',
    canSpawn: [],
    suggestsBeats: [5, 7],
    examples: [
      { ref: 'Cinderella', text: 'the moment her dress is torn to pieces' },
      { ref: 'Pinocchio', text: 'a donkey, certain he can never go home' },
      { ref: 'Little Red Riding Hood', text: 'swallowed, and all hope apparently gone' },
    ],
  },
  {
    id: 'boost-faults',
    group: 'boost',
    art: 'boost-faults',
    headline: 'Does the main character have faults?',
    guidance:
      'Nobody is perfect, and flaws are what make us like a character. Sometimes the weakness is the very thing ' +
      'that wins in the end.',
    canSpawn: [],
    suggestsBeats: [4, 5],
    examples: [
      { ref: 'Kung Fu Panda', text: 'Po is lazy' },
      { ref: 'Harry Potter', text: 'he is reckless, and it saves him as often as not' },
      { ref: 'Little Red Riding Hood', text: 'she disobeys her mother and stops for flowers' },
    ],
  },
  {
    id: 'boost-learn',
    group: 'boost',
    art: 'boost-learn',
    headline: 'What do they learn?',
    guidance:
      'Every experience changes the person it happens to. What is your character sure of at the end that they ' +
      'had no idea about at the start?',
    canSpawn: [],
    suggestsBeats: [9],
    examples: [
      { ref: 'Cinderella', text: 'that she has to fight for what she wants' },
      { ref: 'Pinocchio', text: 'to be honest with the people who love him' },
      { ref: 'Little Red Riding Hood', text: 'never to trust appearances again' },
      { ref: 'Hänsel & Gretel', text: 'not to trust appearances, and that they can count on each other' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dividers — printed cards that carry no prompt (ruling A2). Not playable.
// ---------------------------------------------------------------------------

export const DIVIDERS = [
  { id: 'divider-prompts', art: 'divider-prompts', group: 'prompt', label: 'Prompts' },
  { id: 'divider-ingredients', art: 'divider-ingredients', group: 'ingredient', label: 'Ingredients' },
  { id: 'divider-structure', art: 'divider-structure', group: 'structure', label: 'Structure', erratum: 'E1' },
  { id: 'divider-boosts', art: 'divider-boosts', group: 'boost', label: 'Boosts' },
];

// ---------------------------------------------------------------------------
// One lookup per kind of thing (§10.16): every playable card, by id.
// ---------------------------------------------------------------------------

export const ALL_CARDS = [IDEA_CARD, ...PROMPTS, ...INGREDIENTS, ...BEATS, ...BOOSTS];

const BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]));

export function getCard(id) {
  return BY_ID.get(id) || null;
}

export const STEPS = [
  { id: 'idea', n: 1, name: 'Idea', route: '#/build/idea' },
  { id: 'ingredients', n: 2, name: 'Ingredients', route: '#/build/ingredients' },
  { id: 'structure', n: 3, name: 'Structure', route: '#/build/structure' },
  { id: 'boost', n: 4, name: 'Boost', route: '#/build/boost' },
  { id: 'tell', n: 5, name: 'Tell', route: '#/build/tell' },
];
