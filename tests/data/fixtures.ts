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

export const API_ENDPOINTS = {
  generateVideo: '/api/generate-video',
  videoStatus: '/api/video-status',
  videoHistory: '/api/video-history',
} as const;
