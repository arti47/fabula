// House aids (CLAUDE.md §2.2). These tables are NOT from the Fabula deck or its booklet — they are
// this project's invention, for a kid who is stuck and does not want to roll again.
//
// Rules they follow:
//   * single words or short phrases only — they feed your imagination, they do not hand you a story
//   * no setting content: no named places, people or brands
//   * every screen that shows one labels it as ours
export const HOUSE_AID = true;

export const SPARK_TABLES = [
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
