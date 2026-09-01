// The first-story walkthrough (CLAUDE.md §6.2 layer 3). Its own route, a screen rather than a
// modal sequence, so a kid can come back to it mid-story. Every step says what to tap and, more
// importantly, why the book asks for it.

import { el, add } from './core.js';
import { explain, clearActionBar } from './ui.js';

const STEPS = [
  {
    title: 'Put your name in',
    body: 'The first screen asks who is telling stories. Type your name and tap Start. Everything you write is kept under that name on this device — so if somebody else uses the same tablet, they get their own shelf and never see yours.',
  },
  {
    title: 'Start a story and give it a name',
    body: 'Tap New story. The name is only a label, and you can change it later — plenty of stories get their real title at the very end, once you know what they turned out to be about.',
  },
  {
    title: 'Find the idea',
    body: 'One sentence: what is this story about? “A panda wants to learn kung fu” is a whole idea. If nothing comes, tap Roll the die: each face gives you a Prompt card — a magic object, a hero who is not a person, somebody with a special power. Do not like what you got? Roll again. The book is clear that this costs nothing and you can do it forever.',
  },
  {
    title: 'Build the ingredients',
    body: 'Four cards: your main character, the one standing in their way, the world it happens in, and the something that happens to start it all off. Tap any of them and answer one question at a time. If a question does nothing for you, tap the numbers at the top to jump to another. Blank is fine.',
  },
  {
    title: 'Two heroes, if you want two',
    body: 'Under each card there is Add another. The book says so outright: two main characters, two villains, two worlds — whatever the story needs. And Skip this one for now takes a whole card away until you want it back.',
  },
  {
    title: 'Lay out the nine beats',
    body: 'This is the shape almost every story has: ordinary life, the thing that breaks it, setting off, two trials, the big confrontation, what came of it, one last turn, and the ending. A sentence each is plenty. Beat 2 arrives already filled in from your “Something happens” card — change it as much as you like, the card stays as you wrote it.',
  },
  {
    title: 'Read it once, badly',
    body: 'Tap Tell before you boost anything. It will feel thin, and that is exactly right — the book expects a first draft to be thin. What matters is that the app has now quietly saved this version, so you can compare later.',
  },
  {
    title: 'Boost it',
    body: 'Ten questions about what makes a story worth listening to: who your characters love, why the villain is like that, whether you made it too easy. Skip any you dislike. Two of them can invent a whole new character — that is how Gretel gets into Hänsel and Gretel — and several will send you back to rewrite a beat. Going back is the point, not a mistake.',
  },
  {
    title: 'Read it again, and see what happened',
    body: 'Tap Tell again. Now there are two buttons: before the boosts, and after. Read both. The difference between them is the thing this whole game is teaching you.',
  },
  {
    title: 'Take it with you',
    body: 'Print it, save it as text, or copy it. And if you want to draw it — the book really wants you to draw it — the Learn tab has seven pieces of advice from the artist who drew these cards.',
  },
];

export function tutorialScreen() {
  clearActionBar();
  const wrap = el('div');
  add(wrap, el('h2', { text: 'Your first story' }));
  add(wrap, explain(
    'A walk through making one story from beginning to end, in the order it happens.',
    'You do not have to read it first — open it whenever you get stuck, and close it again.',
  ));
  add(wrap, el('p', { class: 'note', text: 'Ten steps. None of them take long.' }));

  STEPS.forEach((step, i) => {
    add(wrap, add(
      el('details', { class: 'explain learn-entry' }),
      el('summary', { text: `${i + 1}. ${step.title}` }),
      el('div', {}, el('p', { text: step.body })),
    ));
  });

  add(wrap, el('p', {}, el('a', { class: 'button', href: '#/stories', text: 'Right — let me start one' })));
  return wrap;
}
