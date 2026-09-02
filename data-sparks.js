// House aids (CLAUDE.md §2.2). None of this is from the Fabula deck or its booklet — it is this
// project's invention, for a kid who is stuck in front of a particular question.
//
// Rules every row follows, and the tests enforce:
//   * a fragment, never a finished answer — it must leave the kid something to do
//   * eight words or fewer, and no full stop
//   * no names, places or brands: describe the thing, never label it
//   * {hero}, {villain} and {world} are filled in from the story where it has named them, and fall
//     back to "the hero", "the villain", "that place" where it has not
//
// One table per input the app asks for, keyed by that input's own id. A table with no input, or an
// input with no table, is a finding — see tests/sparks.test.mjs.

export const HOUSE_AID = true;

/** The five open tables on the Idea screen: no question asked yet, so they cast wide. */
export const IDEA_SPARKS = [
  {
    id: 'who',
    label: 'Somebody',
    prompt: 'What if the story is about…',
    rows: [
      'a child who never sleeps', 'the smallest one in the family', 'a very old inventor',
      'somebody nobody believes', 'a twin', 'the new one at school', 'a bored king',
      'a lighthouse keeper', 'a runaway', 'somebody with a secret job', 'a champion who lost once',
      'the last of something', 'a liar who has stopped lying', 'somebody who is always late',
      'a keeper of animals', 'a child raised by somebody strange',
    ],
  },
  {
    id: 'thing',
    label: 'Something',
    prompt: 'What if it turns on…',
    rows: [
      'a key that fits nothing', 'a map drawn wrong on purpose', 'a coat that remembers',
      'a jar of weather', 'a bell nobody may ring', 'a book that writes back', 'a broken compass',
      'a single wing', 'a coin from a country that never existed', 'a mirror that is slow',
      'a seed nobody can plant', 'a door with no wall', 'a rope that is never long enough',
      'a lamp that only lights the past', 'a whistle only one person hears', 'a shoe that walks off',
    ],
  },
  {
    id: 'place',
    label: 'Somewhere',
    prompt: 'What if it happens…',
    rows: [
      'under a frozen lake', 'in a house that is always being built', 'on the last train',
      'in a town where it is always Tuesday', 'inside a very large animal', 'above the clouds',
      'in a library with no doors', 'on a floating island', 'in a market that appears at night',
      'at the bottom of a well', 'in a forest that moves', 'in a city built on stilts',
      'behind a waterfall', 'in a valley nobody has mapped', 'on a ship that never lands',
      'in the walls of a school',
    ],
  },
  {
    id: 'trouble',
    label: 'Trouble',
    prompt: 'What if the trouble is…',
    rows: [
      'something has gone missing', 'a promise cannot be kept', 'the wrong person got the blame',
      'a rule has to be broken', 'somebody arrives who should not exist', 'a secret is nearly out',
      'the way home is gone', 'two friends want the same thing', 'time is running out',
      'somebody is not who they said', 'help was asked for and refused', 'a debt has come due',
      'the weather has stopped', 'something has woken up', 'a door was opened',
      'everyone has forgotten one thing',
    ],
  },
  {
    id: 'whatif',
    label: 'What if',
    prompt: 'What if…',
    rows: [
      'the villain is right', 'nobody can lie', 'you can only speak once a day',
      'shadows are alive', 'the animals are in charge', 'growing up happens overnight',
      'everyone shares one memory', 'the hero already lost', 'colours mean something',
      'the sky is closer than it looks', 'you can trade a feeling', 'names are dangerous',
      'the ending happens first', 'nothing breaks, ever', 'you can hear plants',
      'everybody is somebody else on Sundays',
    ],
  },
];

/** One table per input, keyed by the input's own id. */
export const INPUT_SPARKS = {
  // ---- Main character ------------------------------------------------------
  'hero.age': [
    'younger than they act', 'older than they look', 'exactly your age',
    'old enough to be left alone', 'the youngest of several', 'nobody has ever asked',
    'a year older than yesterday', 'too young to be believed', 'almost grown, not quite',
    'ancient, and does not mention it', 'born the night something happened', 'twelve, and furious about it',
    'the same age as the trouble', 'young enough to still climb things', 'older than everyone thinks',
    'has stopped counting',
  ],
  'hero.looks': [
    'always carrying something', 'one thing they never take off', 'small for the job',
    'covered in something', 'hair that will not behave', 'wears the wrong clothes for the weather',
    'a scar nobody explains', 'looks like somebody else', 'you notice the hands first',
    'too tidy to be trusted', 'patched, mended, patched again', 'walks like they are listening',
    'never quite still', 'a face that gives everything away', 'borrowed boots',
    'you would not pick them out of a crowd',
  ],
  'hero.special': [
    'can hear what nobody says', 'remembers everything, usefully or not', 'brave in the wrong moments',
    'good with animals, bad with people', 'never gets lost', 'can fix anything once',
    'notices what others walk past', 'reads faster than they talk', 'lucky, and knows it is luck',
    'the only one who will go first', 'can hold their breath a long time', 'makes people tell the truth',
    'never drops anything', 'sleeps through everything', 'good at the thing nobody needs',
    'stubborn past the point of sense',
  ],
  'hero.fear': [
    'the dark under the stairs', 'being forgotten', 'deep water', 'being laughed at',
    'small spaces', 'birds', 'the sound of the door at night', 'being wrong in front of everyone',
    'losing the one thing they carry', 'going home', 'being like their parent',
    'the thing that happened before', 'silence', 'not being believed', 'heights, and hides it',
    'nothing at all, which is its own problem',
  ],
  'hero.want': [
    'to be believed', 'to go home', 'to get somebody back', 'to be left alone',
    'to prove they can', 'to stop something happening again', 'to keep a promise',
    'to find out who they are', 'to be chosen for once', 'to fix what they broke',
    'to see what is over there', 'to be forgiven', 'to be the one who knows',
    'to make somebody sorry', 'to belong somewhere', 'to be allowed to leave',
  ],
  'hero.name': [
    'a name that sounds like a bell', 'named after the thing they carry', 'a name nobody says right',
    'two syllables, both hard', 'a name that is really a job', 'shortened by everyone but one person',
    'named for a place', 'a name they chose themselves', 'a nickname that stuck and stung',
    'named after somebody gone', 'a name that means small', 'called by their last name only',
    'a name from a language nobody speaks now', 'the name of a bird', 'a name that starts soft, ends sharp',
    'no name yet — that is the story',
  ],

  // ---- Antagonist ----------------------------------------------------------
  'villain.age': [
    'much older than {hero}', 'the same age, which is worse', 'has been doing this a long time',
    'young, and already dangerous', 'as old as the trouble itself', 'nobody knows, nobody asks',
    'looks young, is not', 'was a child when it started', 'older than the town',
    'one generation up', 'ageless, and tired of it', 'exactly as old as they need to be',
    'grew up alongside {hero}', 'newly made, and clumsy', 'old enough to be patient',
    'stopped ageing at some point',
  ],
  'villain.looks': [
    'kind-looking, which helps them', 'always perfectly tidy', 'too big for the room',
    'you never see them properly', 'smiles at the wrong times', 'thin, and very still',
    'wears something taken from somebody', 'looks like the hero, a little', 'always in the doorway',
    'hands you notice too late', 'ordinary, completely ordinary', 'never seen twice the same',
    'a voice much nicer than the face', 'dressed for weather that is not happening', 'moves without sound',
    'nothing frightening about them at all',
  ],
  'villain.special': [
    'very good at lying', 'always knows what you want', 'never in a hurry',
    'remembers every slight', 'can make people agree', 'never has to ask twice',
    'is not wrong, only cruel', 'gets others to do it', 'endlessly patient',
    'never breaks a rule, only bends it', 'can be in two places, apparently', 'nobody believes they did it',
    'good at being liked', 'knows one thing {hero} does not', 'cannot be surprised',
    'wins by waiting',
  ],
  'villain.fear': [
    'being found out', 'being alone with it', 'somebody braver arriving', 'being pitied',
    'the thing they did before', '{hero}, and will not say so', 'losing what they took',
    'being forgiven', 'the truth, plainly said', 'someone who cannot be bought',
    'growing old', 'being ordinary', 'a person from long ago', 'the dark, same as everyone',
    'nothing, and that is the frightening part', 'being remembered wrongly',
  ],
  'villain.want': [
    'what {hero} has', 'to be remembered', 'to be left alone with it', 'to put things back',
    'to win an old argument', 'to be the one in charge', 'to stop somebody leaving',
    'to be admired', 'to be safe, at any cost', 'to make somebody understand',
    'to keep the secret buried', 'to have it be fair, their version', 'to never be hungry again',
    'to undo one afternoon', 'to be feared, since liking failed', 'more, always more',
  ],
  'villain.name': [
    'a title, not a name', 'named by what they take', 'a name said in a whisper',
    'the name of a job long gone', 'named after a colour', 'two names, neither real',
    'called something polite and wrong', 'named for a weather', 'a name that rhymes with nothing',
    'the name {hero} refuses to say', 'named after an animal that hunts', 'a very ordinary name',
    'named backwards', 'a name with too many letters', 'the name on the door',
    'nobody has ever named them',
  ],

  // ---- World ---------------------------------------------------------------
  'world.special': [
    'the water runs the wrong way', 'nothing here grows straight', 'every door is a different size',
    'the animals talk, badly', 'it snows indoors', 'nobody remembers who built it',
    'the buildings move slowly', 'there is one rule and it is strange', 'it is always the same hour',
    'the ground hums', 'there used to be more of it', 'magic works but costs something',
    'nothing here is finished', 'the sky is close enough to touch', 'everything is borrowed',
    'it looks ordinary until you stay',
  ],
  'world.whereWhen': [
    'a hundred years after something went wrong', 'now, but one street over',
    'the week before a festival', 'a winter that has lasted too long',
    'far enough that letters take months', 'somewhere with two moons',
    'the year the river changed course', 'a summer nobody wants to end',
    'a long way down', 'the edge of somewhere bigger', 'after the sea came in',
    'before anyone made maps', 'a place you reach only by accident',
    'the last town on the road', 'a night that will not end', 'right here, but sideways',
  ],
  'world.typicalDay': [
    'everyone works at night', 'the bells decide everything', 'you queue for water',
    'nobody goes out at noon', 'the day starts with a list', 'people trade instead of paying',
    'children are sent out early', 'the same three jobs, forever', 'you are told where to be',
    'everyone watches the sky', 'the market is the only news', 'nothing happens, on purpose',
    'you walk everywhere, always', 'the day is measured by tides', 'people work, then hide',
    'it is quieter than it should be',
  ],
  'world.peopleDo': [
    'they eat standing up', 'nobody says goodbye', 'children play a game with rules nobody wrote',
    'everyone sings badly, on purpose', 'meals are shared with strangers', 'they trade small favours',
    'you take your shoes off everywhere', 'people keep birds', 'the old tell the stories, badly',
    'they leave food out at night', 'nobody touches the middle of the road', 'they name their tools',
    'you never eat alone', 'they mark doors with chalk', 'everyone can whistle a signal',
    'they bury things instead of throwing them away',
  ],

  // ---- Something happens ---------------------------------------------------
  'event.what': [
    'something arrives that should not', 'a door is opened', 'somebody does not come home',
    'a letter comes for the wrong person', 'the water goes', 'a stranger asks for {hero} by name',
    'something is stolen in the night', 'the ground shifts', 'a promise is broken publicly',
    'an animal behaves impossibly', 'somebody comes back after years', 'a light appears where none should',
    'the noise stops', 'a debt is called in', 'something is found buried',
    'a rule is changed overnight',
  ],
  'event.goodOrBad': [
    'good, and then not', 'bad, and secretly welcome', 'nobody can agree',
    'good for {hero}, terrible for everyone else', 'bad, and long overdue',
    'it depends who you ask', 'good for a day', 'bad, but it lets {hero} leave',
    'a relief, and a disaster', 'neither, just enormous', 'wonderful, at a price',
    'bad in the way that changes people', 'good news badly delivered', 'awful, and nobody notices',
    'lucky, suspiciously so', 'it will look different later',
  ],
  'event.antagonistsFault': [
    'no, but it suits {villain}', 'yes, and nobody knows yet', 'partly, and years ago',
    'no — this is what makes {villain} act', 'yes, and they are proud of it',
    'they let it happen', 'it was meant for somebody else', 'they think it was them',
    'no, and they get blamed anyway', 'yes, and it went further than planned',
    'they only put it in motion', 'no — {villain} arrives because of it',
    'yes, but they were told to', 'nobody will ever prove it', 'it was an accident of theirs',
    'not this time',
  ],
  'event.howItChanges': [
    '{hero} has to leave', 'nobody can pretend any more', 'sides have to be chosen',
    'the way back closes', 'someone has to be told', 'the smallest one is sent',
    'a secret becomes useful', '{hero} is the only one who saw', 'help must be asked for',
    'the plan has to happen tonight', 'everyone starts watching each other', 'the old rule stops working',
    'somebody has to be found first', 'the story stops being private', 'trust runs out',
    'there is no more waiting',
  ],

  // ---- The nine beats ------------------------------------------------------
  'beat.1': [
    'a morning like any other', 'the job {hero} always does', 'somebody complaining about the weather',
    'a room that says everything', 'the walk to somewhere ordinary', 'a habit nobody questions',
    'a small argument, the usual one', 'the thing {hero} is not allowed to touch',
    'a meal, and who sits where', 'work that never finishes', 'the sound the house makes',
    'a chore done badly', 'the neighbour and their nonsense', 'something waiting to be mended',
    'the last quiet evening', 'a promise made too easily',
  ],
  'beat.2': [
    'a knock', 'somebody is missing at breakfast', 'a stranger in the wrong clothes',
    'the letter nobody expected', 'a noise from the quietest room',
    'the thing that was buried is not', 'a message meant for somebody else',
    'the animals leave first', 'a name {hero} has not heard for years',
    'the road is closed', 'somebody says the word out loud', 'a light where the dark should be',
    'the rule stops applying', 'a debt arrives with a face', 'somebody asks for help, badly',
    'the weather does something new',
  ],
  'beat.3': [
    '{hero} takes the thing and goes', 'a bag packed too fast', 'the gate left open behind them',
    'nobody is told', 'a lie about where they are going', 'the first step onto the road',
    'a decision made in the dark', 'something left behind on purpose', 'the door pulled shut',
    'a promise made to somebody small', 'the last look back', 'walking while everyone sleeps',
    'a hand taken', 'the map that turns out to be wrong', 'no plan at all',
    'saying yes before thinking',
  ],
  'beat.4': [
    'the way is blocked', 'somebody asks a question {hero} cannot answer', 'a river to cross',
    'a stranger who wants paying', 'the first lie told to their face', 'a wrong turning',
    'help arrives with conditions', 'something goes missing from the bag', 'a gate that only opens one way',
    'somebody recognises {hero}', 'the shortcut is not one', 'a test disguised as kindness',
    'the food runs out', 'they are followed', 'a promise gets in the way',
    'the first real fright',
  ],
  'beat.5': [
    'and it goes wrong this time', 'the trap was the help', 'somebody is taken',
    '{hero} chooses badly, and knows it', '{villain} gets there first', 'the thing breaks',
    'a friend turns back', 'they are too late by minutes', 'the truth arrives at the worst moment',
    'the way back closes properly', 'somebody is hurt because of {hero}', 'the plan is discovered',
    'they lose what they came with', 'a kindness is repaid with a trick', 'the ground gives way',
    'nobody comes when called',
  ],
  'beat.6': [
    'face to face at last', 'no weapons, only talking', 'in the place {villain} chose',
    'the question {hero} has been avoiding', '{villain} is almost reasonable',
    'a fight nobody wins quickly', 'the offer that is hard to refuse', 'somebody has to go first',
    'the truth said out loud, finally', 'the smallest one steps forward', 'a door held shut from both sides',
    'they are alone with it', 'the thing {hero} fears, in the room', 'a choice with no good side',
    'help is one minute away', 'and it is not who they expected',
  ],
  'beat.7': [
    'won, and it cost something', 'lost, badly', '{villain} walks away', '{hero} is not the same after',
    'they got the thing and it is wrong', 'somebody else pays for it', 'a victory nobody sees',
    'the truth is out and helps nobody', 'they are alone now', 'it worked, for now',
    'the wrong person is blamed', 'nothing is settled', 'they win by giving something up',
    '{villain} was telling the truth', 'the thing is broken beyond mending', 'they survive, which is all',
  ],
  'beat.8': [
    'somebody comes back', 'the help wants paying', 'a second {villain}, worse',
    'the thing was never the point', 'somebody arrives too late to be told', 'the news reaches home',
    '{villain} is sorry, and means it', 'the smallest one saves it', 'a promise from long ago comes due',
    'the weather turns', 'somebody confesses', 'they are found by the wrong people',
    'the way home is not where it was', 'an old kindness pays', 'the truth reaches the wrong ear',
    'one more thing goes wrong, quickly',
  ],
  'beat.9': [
    'home, and different', 'they stay where they ended up', 'something is planted',
    'a door left open this time', 'the thing is given away', 'nobody says it, everybody knows',
    'a meal, and who sits where now', 'the habit is broken for good', 'they are asked, and say no',
    'a new rule, quietly kept', 'the youngest is listened to', 'they go back for somebody',
    '{villain} is remembered kindly, mostly', 'the road is still there', 'a promise made properly this time',
    'and then, years later',
  ],

  // ---- The ten boosts ------------------------------------------------------
  'boost-care': [
    'a brother who is a nuisance', 'the grandparent who understands', 'someone they write to',
    'an animal, entirely', 'the friend they fell out with', 'somebody they have never met',
    'a person they are ashamed of', 'the one who taught them', 'a neighbour, secretly',
    'somebody who is gone', 'the youngest, fiercely', 'a person who does not know',
    'their whole difficult family', 'someone {villain} also loves', 'a stranger, after this',
    'themselves, eventually',
  ],
  'boost-help': [
    'a younger sister who is braver', 'somebody who owes them', 'an animal that keeps turning up',
    'the person nobody trusts', 'a stranger with their own reasons', 'somebody who helps badly',
    'an old enemy, reluctantly', 'a child who knows the way', 'someone who helps once and vanishes',
    'a helper who wants paying', 'the quiet one at the back', 'somebody from the other side',
    'help that arrives too late to be help', 'a person who only gives advice', 'the one they refused earlier',
    'nobody — and that is the point',
  ],
  'boost-why-villain': [
    'they were left behind once', 'they think they are protecting somebody', 'nobody ever said no to them',
    'they lost the same thing {hero} has', 'they were told to', 'they are frightened, and hide it',
    'it worked the first time', 'they believe it is fair', 'somebody did it to them',
    'they cannot stop now', 'they were laughed at, years ago', 'they think {hero} is the villain',
    'they are hungry, plainly', 'they are keeping a promise too', 'they were made this way',
    'they are not, quite',
  ],
  'boost-too-easy': [
    'make them do it twice', 'take away the thing that worked', 'add somebody to protect',
    'give them less time', 'let the first plan fail entirely', 'make the help cost something',
    'put water in the way', 'let {villain} be one step ahead', 'break the useful thing',
    'make them choose between two goods', 'send them the long way', 'let them be believed by nobody',
    'take a friend out of it', 'make the weather turn', 'have them arrive too late, once',
    'let them fail, properly',
  ],
  'boost-twist': [
    'the helper was working for {villain}', 'the smallest one does it', 'they were related all along',
    'the thing was never real', '{villain} is already dead', 'it happened years earlier than anyone said',
    'the warning was the trap', 'they were in the wrong place the whole time',
    'somebody swapped places', 'the story is being told by {villain}', 'they were sent, not lost',
    'the rescue was a delivery', 'the map was drawn afterwards', 'nobody was chasing them',
    'the thing wanted to be found', 'they get exactly what they asked for',
  ],
  'boost-background': [
    'a house that burned', 'a promise made at seven', 'the parent nobody mentions',
    'a debt older than {hero}', 'the year they did not speak', 'somebody who left first',
    'a prize won and lost', 'the day they stopped believing something', 'a scar with a story',
    'a place they can never go back to', 'the thing they were blamed for', 'a sibling who went away',
    'the winter everyone remembers', 'a lie told once and kept', 'the person who taught {villain}',
    'nothing much, which is its own answer',
  ],
  'boost-narrator': [
    '{hero}, years later', 'the animal that watched', 'somebody who got it wrong',
    'the youngest, and they exaggerate', 'a person telling it to a child', '{villain}, who lies',
    'the house itself', 'somebody who was not there', 'two people arguing over the details',
    'a letter, read aloud', 'the one who did not survive it', 'a stranger in a market',
    'the person who wrote it down badly', 'somebody who heard it from somebody', 'a court, taking evidence',
    'nobody at all, just the facts',
  ],
  'boost-despair': [
    'alone, and nobody coming', 'when the help walks away', 'the moment they believe {villain}',
    'when they find out it was their fault', 'the door that does not open', 'losing the last of it',
    'when the plan is taken from them', 'hearing it from somebody they trust', 'the dark, and no way to count time',
    'when they are told to go home', 'watching from too far away', 'the promise they cannot keep now',
    'when nobody believes them, again', 'the cold hour before morning', 'when they stop asking',
    'the moment they nearly give it up',
  ],
  'boost-faults': [
    'they never listen properly', 'too proud to ask', 'they lie when frightened',
    'always late', 'they cannot leave anything alone', 'they take the credit',
    'too quick to trust', 'they run first, always', 'stubborn about the wrong things',
    'they laugh at the wrong moment', 'careless with other people', 'they cannot say sorry',
    'they want to be liked too much', 'they give up one minute early', 'jealous, quietly',
    'brave in danger, cowardly in kindness',
  ],
  'boost-learn': [
    'to ask before it is too late', 'that being right is not enough', 'to let somebody help',
    'that {villain} was a person', 'to go back for people', 'that home changed while they were gone',
    'to stop counting who owes what', 'that the small one was right', 'to say the true thing out loud',
    'that winning cost more than losing would have', 'to stay when it is hard',
    'that nobody is coming, so it is them', 'to forgive one thing', 'that they were braver than they knew',
    'to leave some things buried', 'nothing — and that is the ending',
  ],
};

/** The placeholders a row may use, and what to say when the story has not named one yet. */
export const SPARK_PLACEHOLDERS = {
  hero: 'the hero',
  villain: 'the villain',
  world: 'that place',
};

export function sparksFor(key) {
  return INPUT_SPARKS[key] || null;
}
