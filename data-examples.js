// The two stories the booklet works through, as complete story records (T7).
//
// They are read through exactly the same assembly as a kid's own story (§10.9: one record, one
// renderer). Hänsel & Gretel carries a snapshot, because the book deliberately tells it twice —
// once as a first draft, and again after the Boost cards have been through it.
//
// Retold concisely in this app's voice; the booklet's prose is not reproduced.

export const EXAMPLE_STORIES = [
  {
    id: 'example-red-riding-hood',
    example: true,
    ownerId: null,
    title: 'Little Red Riding Hood',
    blurb: 'The story the booklet answers card by card, all the way through.',
    createdAt: '2021-04-01T00:00:00.000Z',
    updatedAt: '2021-04-01T00:00:00.000Z',
    schemaVersion: 1,
    idea: { text: 'a girl has to cross the forest alone to reach her grandmother', fromPrompt: 'Q', rolls: [] },
    cast: [
      {
        id: 'lrrh-hero', kind: 'hero', origin: 'ingredients',
        answers: {
          age: 'About ten.',
          looks: 'A girl who always wears the red hood her grandmother gave her.',
          special: 'An ordinary child — brave, and a bit disobedient.',
          fear: 'She does not seem frightened of anything. Not even the Wolf.',
          want: 'To reach Grandma and spend time with her.',
          name: 'Little Red Riding Hood',
        },
      },
      {
        id: 'lrrh-villain', kind: 'villain', origin: 'ingredients',
        answers: {
          age: 'Older than her, certainly.',
          looks: 'A talking wolf who can disguise himself and look harmless.',
          special: 'He is very good at lying. And very hungry.',
          fear: 'The Hunter, as we find out later.',
          want: 'To eat Grandma and Little Red Riding Hood.',
          name: 'The Wolf',
        },
      },
    ],
    worlds: [
      {
        id: 'lrrh-world',
        answers: {
          special: 'The classic fairy-tale world. There is a forest, and the animals talk.',
          whereWhen: 'No time or place is ever given. A village, a forest, and Grandma living beyond it.',
          typicalDay: 'People go about their business in the village and walk in the forest.',
          peopleDo: 'Children play together, but they are forbidden to stray off the road.',
        },
      },
    ],
    inciting: {
      answers: {
        what: 'Grandma falls ill, and Little Red Riding Hood has to cross the forest to reach her.',
        goodOrBad: 'Negative — it leads straight to the Wolf.',
        antagonistsFault: 'No. The Wolf only takes advantage of it.',
        howItChanges: 'She takes the job on willingly, and leaves home.',
      },
    },
    beats: {
      1: { text: 'there was a girl everyone called Little Red Riding Hood, because of the red hood her grandmother made her, which she never took off.' },
      2: { text: 'her grandmother fell ill, and her mother asked her to carry food across the forest to her.' },
      3: { text: 'She took the basket and set off into the trees, on the road she had been told never to leave.' },
      4: { text: 'she met the Wolf, who asked, very politely, where her grandmother lived. She did not recognise what he was, and she told him.' },
      5: { text: 'the Wolf stopped her again to admire the flowers. She stayed to pick a bunch — and while she did, he reached the cottage first and swallowed Grandma whole.' },
      6: { text: 'She arrived at the cottage and talked with the thing in her grandmother’s bed, and still did not see it.' },
      7: { text: 'she lost. The Wolf ate her too, and went to sleep.' },
      8: { text: 'the Hunter passed the cottage, heard the snoring, understood at once what had happened, and cut them both out alive.' },
      9: { text: 'she knew what her mother had meant: stay on the road, and do not linger in the forest.' },
    },
    boosts: {
      'boost-care': { answer: 'Her mother, and her grandmother most of all.', skipped: false, editedBeats: [] },
      'boost-help': { answer: 'The Hunter — and we wait a very long time for him. Without him she would not have made it.', skipped: false, editedBeats: [] },
      'boost-why-villain': { answer: 'Did the Wolf ever choose to be what he is? He is hungry, and he is good at lying, and nobody in the story asks him anything.', skipped: false, editedBeats: [] },
      'boost-too-easy': { answer: 'If she had recognised him at the first meeting it would be half a story. She has to be fooled twice.', skipped: false, editedBeats: [] },
      'boost-background': { answer: 'She loves her grandmother and she is a little unruly. And what is the Wolf’s story? Or the Hunter’s?', skipped: false, editedBeats: [] },
      'boost-narrator': { answer: 'Someone outside it all, telling it long afterwards. Imagine it told by Grandma instead.', skipped: false, editedBeats: [] },
      'boost-despair': { answer: 'The moment she is swallowed and everything goes dark. All hope gone.', skipped: false, editedBeats: [] },
      'boost-faults': { answer: 'She disobeys her mother, and she stops for flowers when she should be walking.', skipped: false, editedBeats: [] },
      'boost-learn': { answer: 'Never to trust appearances again.', skipped: false, editedBeats: [] },
    },
    snapshot: null,
    skipped: [],
  },

  {
    id: 'example-hansel-gretel',
    example: true,
    ownerId: null,
    title: 'Hänsel and Gretel',
    blurb: 'The booklet builds this one twice — a first draft, then the same story after the Boost cards.',
    createdAt: '2021-04-01T00:00:00.000Z',
    updatedAt: '2021-04-01T00:00:00.000Z',
    schemaVersion: 1,
    idea: { text: 'a child gets lost in the forest and meets an evil witch', fromPrompt: 'Q', rolls: [] },
    cast: [
      {
        id: 'hg-hansel', kind: 'hero', origin: 'ingredients',
        answers: {
          age: 'Seven or eight.', looks: 'An ordinary boy.', special: 'Clever, and brave with it.',
          fear: 'Nothing much frightens him.', want: 'To get away from the witch and go home.', name: 'Hänsel',
        },
      },
      {
        id: 'hg-gretel', kind: 'hero', origin: 'boost:boost-help',
        answers: {
          age: 'A little younger than her brother.', looks: 'An ordinary girl.',
          special: 'A bit of a coward — and the one who saves him in the end.',
          fear: 'Being abandoned. Being left alone.', want: 'To save herself and her brother.', name: 'Gretel',
        },
      },
      {
        id: 'hg-witch', kind: 'villain', origin: 'ingredients',
        answers: {
          age: 'Very old.', looks: 'Gaunt and wrinkled.', special: 'She is wicked, and she eats children.',
          fear: 'Nothing at all.', want: 'To eat Hänsel.', name: 'The Witch',
        },
      },
      {
        id: 'hg-stepmother', kind: 'villain', origin: 'boost:boost-why-villain',
        answers: {
          age: 'A grown-up.', looks: 'We never find out.', special: 'Hard, and used to being obeyed.',
          fear: 'Running out of food.', want: 'To be rid of the children.', name: 'The Stepmother',
        },
      },
    ],
    worlds: [
      {
        id: 'hg-world',
        answers: {
          special: 'An enormous forest — and somewhere inside it, a house made of gingerbread where a witch lives.',
          whereWhen: 'A fairy-tale world, at no particular time.',
          typicalDay: 'Dad goes out to cut firewood and Mum stays home with the children. They are very poor.',
          peopleDo: 'The children play with the animals and the other children, and wander round the village.',
        },
      },
    ],
    inciting: {
      answers: {
        what: 'Hänsel gets lost in the forest.',
        goodOrBad: 'Bad, certainly for him.',
        antagonistsFault: 'We do not know yet.',
        howItChanges: 'He is frightened, but he starts looking for a way out.',
      },
    },
    // The story as it stands: after the boosts have been through it.
    beats: {
      1: { text: 'Hänsel and Gretel lived with their parents in a house at the edge of the forest. The family was poor and there was almost nothing to eat.' },
      2: { text: 'things got so bad that their stepmother decided to leave them in the forest.' },
      3: { text: 'Hänsel worked out what she meant to do, and filled his pockets with shining pebbles to leave a trail.' },
      4: { text: 'their father walked them deep into the trees and left them there — but the pebbles brought them home safe.' },
      5: { text: 'a few days later he took them back again. This time they were caught by surprise, and Hänsel could only crumble a piece of bread behind him. The birds ate every crumb, and the way home was gone.' },
      6: { text: 'Lost, they found a cottage made of marzipan with a kind old woman in it. They were starving and they ate. The old woman turned out to be a witch: she caged Hänsel to fatten him and kept Gretel as a servant.' },
      7: { text: 'Hänsel was about to be eaten — and Gretel, the small one, the frightened one, tricked the witch into the oven and shut the door. They ran, with the witch’s jewels and as many sweets as they could carry.' },
      8: { text: 'they still had to find their way home, and a river ran too fast to cross. A duck carried them over, one at a time.' },
      9: { text: 'they came home to their father, who wept to see them. The stepmother was gone, and the treasure meant nobody in that house went hungry again.' },
    },
    boosts: {
      'boost-help': { answer: 'Hänsel is on his own the whole way through. Give him a little sister — Gretel — so he has somebody to protect, and somebody who can save him.', skipped: false, editedBeats: [1, 6, 7] },
      'boost-care': { answer: 'The two of them love each other, and they love their father.', skipped: false, editedBeats: [] },
      'boost-why-villain': { answer: 'The old woman seems kind and is not. And why did nobody come back for them? Because the mother is a stepmother, and she talked their father into it.', skipped: false, editedBeats: [2] },
      'boost-too-easy': { answer: 'Make them face it twice: the pebbles work, the breadcrumbs do not. And put a river in the way of going home — with the same duck that ate the crumbs, wanting to be forgiven.', skipped: false, editedBeats: [3, 4, 5, 8] },
      'boost-twist': { answer: 'Everyone expects Hänsel to get them out. It is Gretel — the younger, the frightened one — who puts the witch in her own oven.', skipped: false, editedBeats: [7] },
      'boost-background': { answer: 'The family is desperately poor with almost nothing to eat, and that is the whole reason the stepmother can talk their father into it.', skipped: false, editedBeats: [1] },
      'boost-narrator': { answer: 'Someone outside the story, telling it afterwards — though it could be told by Hänsel and Gretel themselves.', skipped: false, editedBeats: [] },
      'boost-despair': { answer: 'Two of them: the moment the crumbs are gone, and the moment Hänsel is in the cage being fattened while Gretel has to help.', skipped: false, editedBeats: [5] },
      'boost-faults': { answer: 'They are good children and completely naive. They see a house made of sweets and think they are safe.', skipped: false, editedBeats: [] },
      'boost-learn': { answer: 'Not to trust how things look — and that they can count on each other. He gives her courage when they are lost; she saves him when it matters most.', skipped: false, editedBeats: [9] },
    },
    // The first draft, exactly as the booklet writes it before the Boost step: one child, no sister.
    snapshot: {
      takenAt: '2021-04-01T00:00:00.000Z',
      idea: { text: 'a child gets lost in the forest and meets an evil witch', fromPrompt: 'Q', rolls: [] },
      cast: [
        { id: 'hg-hansel', kind: 'hero', origin: 'ingredients', answers: { age: 'Seven or eight.', looks: 'An ordinary boy.', special: 'Clever, and brave with it.', fear: 'Nothing much frightens him.', want: 'To get away from the witch and go home.', name: 'Hänsel' } },
        { id: 'hg-witch', kind: 'villain', origin: 'ingredients', answers: { age: 'Very old.', looks: 'Gaunt and wrinkled.', special: 'She is wicked, and she eats children.', fear: 'Nothing at all.', want: 'To eat Hänsel.', name: 'The Witch' } },
      ],
      worlds: [
        { id: 'hg-world', answers: { special: 'An enormous forest — and somewhere inside it, a house made of gingerbread where a witch lives.', whereWhen: 'A fairy-tale world, at no particular time.', typicalDay: 'Dad goes out to cut firewood and Mum stays home with the children. They are very poor.', peopleDo: 'The children play with the animals and the other children, and wander round the village.' } },
      ],
      inciting: { answers: { what: 'Hänsel gets lost in the forest.', goodOrBad: 'Bad, certainly for him.', antagonistsFault: 'We do not know yet.', howItChanges: 'He is frightened, but he starts looking for a way out.' } },
      beats: {
        1: { text: 'Hänsel lived with his parents in a house near the forest. The family was poor and there was little to eat.' },
        2: { text: 'he went out into the forest with his father.' },
        3: { text: 'He ate some bread as he walked, and dropped the crumbs behind him on the path.' },
        4: { text: 'he was distracted and lost his way. His father went home, and Hänsel was alone in the trees.' },
        5: { text: 'he tried to follow the crumbs back — but the birds had eaten every one, and he could not find the way.' },
        6: { text: 'Walking on, he found a house with a kind old woman living in it. The house was made of marzipan and he was very hungry, so he ate. The old woman turned out to be a witch, and she shut him in.' },
        7: { text: 'he got the witch into the oven meant for him and escaped, taking the precious stones he found in the house and as many sweets as he could carry.' },
        8: { text: 'he still had to find his way home. He asked a duck, who showed him the way.' },
        9: { text: 'he came back to his parents, who were overjoyed, and the riches he brought kept them all.' },
      },
    },
    skipped: [],
  },
];

export function getExample(id) {
  return EXAMPLE_STORIES.find((s) => s.id === id) || null;
}
