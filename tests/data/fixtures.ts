export const PROMPTS = {
  simple: 'A red ball bouncing on a white floor',
  cinematic: 'A cinematic shot of a sunset over the ocean with golden hour lighting',
  detective: 'A detective walking into a dimly lit warehouse, camera follows from behind',
} as const;

export const SCREENPLAYS = {
  twoScene: `INT. COFFEE SHOP - MORNING

A barista wipes down the counter as the first customer enters. Warm light streams through the windows.

EXT. CITY STREET - NIGHT

Rain-slicked streets reflect neon signs. A lone figure walks under an umbrella.`,

  singleScene: `INT. LABORATORY - DAY

A scientist peers through a microscope. The room hums with equipment. She looks up, startled by a sudden alarm.`,
} as const;

export const CHEAP_VIDEO_PAYLOAD = {
  n_variants: 1,
  aspect_ratio: 'portrait',
  duration: '4',
} as const;

export const API_ENDPOINTS = {
  generateVideo: '/api/generate-video',
  videoStatus: '/api/video-status',
  videoHistory: '/api/video-history',
} as const;

export const SCREENPLAYS_EDGE = {
  empty: '',
  whitespaceOnly: '   \n\n\t  ',
  singleWord: 'Hello',
  noSceneHeading: 'A man walks into a bar. He orders a drink. The bartender smiles.',
  unicodeHeavy: `INT. カフェ — 朝

一人の女性がコーヒーを飲んでいる。窓の外には桜が咲いている。

EXT. パリの通り — 夜

雨に濡れた石畳。遠くにエッフェル塔が光る。`,
  dialogueHeavy: `INT. COURTROOM - DAY

JUDGE
Order in the court!

LAWYER
Your Honor, my client is innocent.

JUDGE
Let the jury decide.

DEFENDANT
I didn't do it!`,
  malformedHeadings: `INT MISSING DASH DAY

Some action here.

EXT NO PERIOD NIGHT

More action.

This line has no heading at all.`,
  extremelyLong: `INT. OFFICE - DAY\n\n${'A worker types at a desk. '.repeat(200)}`,
  specialCharacters: `INT. CAFÉ "EL NIÑO" - DAY

María López-García enters through the <main> door. She carries a bag worth $1,000 & looks around.

EXT. O'BRIEN'S PUB - NIGHT

"Where's the 100% proof?" asks the bartender. Temperature: -5°C.`,
} as const;

export const PROMPTS_EDGE = {
  empty: '',
  whitespaceOnly: '   ',
  singleChar: 'a',
  unicode: '日本語のプロンプト — 桜が咲く春の風景',
  emoji: '🌅 A beautiful sunset over the ocean 🌊 with dolphins 🐬',
  sqlInjection: "'; DROP TABLE videos; --",
  xssScript: '<script>alert("xss")</script>',
  xssImg: '<img src=x onerror=alert(1)>',
  htmlTags: '<b>Bold</b> <i>italic</i> <a href="http://evil.com">link</a>',
  veryLong: 'A '.repeat(5000) + 'very long prompt',
  newlines: 'Line one\nLine two\nLine three',
  nullBytes: 'test\x00null\x00bytes',
  pathTraversal: '../../../etc/passwd',
  templateLiteral: '${process.env.SECRET_KEY}',
} as const;
