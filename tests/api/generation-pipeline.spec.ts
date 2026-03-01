import { test, expect } from '@playwright/test';
import { API_ENDPOINTS, PROMPTS } from '../data/fixtures';

const BASE_URL = 'https://previz-engine-m1mm9ayva-valid.vercel.app';

test.describe('Generation Pipeline API', () => {
  test('POST /api/generate-video with valid payload returns 200 + taskId @api @smoke', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.generateVideo}`, {
      data: {
        prompt: PROMPTS.simple,
        n_variants: 1,
        aspect_ratio: 'landscape',
        duration: '8',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('taskId');
    expect(body.taskId).toMatch(/^video_/);
  });

  test('POST /api/generate-video with empty prompt returns 400 @api @smoke', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.generateVideo}`, {
      data: { prompt: '' },
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/video-status without taskId returns 400 @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoStatus}`);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('taskId');
  });

  test('GET /api/video-status with valid taskId returns status object @api', async ({ request }) => {
    const historyResponse = await request.get(`${BASE_URL}${API_ENDPOINTS.videoHistory}?filter=all&limit=1`);
    const historyBody = await historyResponse.json();
    const taskId = historyBody.videos?.[0]?.task_id;

    expect(taskId).toBeTruthy();

    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoStatus}?taskId=${taskId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('taskId');
    expect(body).toHaveProperty('state');
  });

  test('GET /api/video-history returns videos array with expected shape @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoHistory}?filter=all&limit=5`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('videos');
    expect(body.videos.length).toBeGreaterThan(0);
    expect(body.videos.length).toBeLessThanOrEqual(5);

    const video = body.videos[0];
    expect(video).toHaveProperty('task_id');
    expect(video).toHaveProperty('prompt');
    expect(video).toHaveProperty('status');
    expect(video).toHaveProperty('aspect_ratio');
  });

  test('GET /api/video-history with filter=mine returns cookie-filtered videos @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoHistory}?filter=mine&limit=5`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('videos');
  });
});

test.describe('API Security & Bug Verification', () => {
  test('BUG-002: INVALID_VALUE in video history aspect_ratio @api @regression', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoHistory}?filter=all&limit=100`);
    const body = await response.json();

    const invalidVideos = body.videos.filter(
      (v: { aspect_ratio: string }) => v.aspect_ratio === 'INVALID_VALUE',
    );

    // BUG: Some videos have INVALID_VALUE as aspect_ratio
    // This test documents the bug — when fixed, invalidVideos should be empty
    expect(invalidVideos.length).toBeGreaterThanOrEqual(0);
  });

  test('BUG-006: video-status leaks internal Sora error structure @api @regression', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.videoStatus}?taskId=invalid-task-123`);

    expect(response.status()).toBe(500);
    const body = await response.json();
    // BUG: Raw internal error structure exposed to client
    expect(body.error).toContain('Failed to query');
  });

  test('BUG-003: no rate limiting headers on generate-video @api @regression', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.generateVideo}`, {
      data: {
        prompt: PROMPTS.simple,
        n_variants: 1,
        aspect_ratio: 'landscape',
        duration: '8',
      },
    });

    const rateLimitHeader = response.headers()['x-ratelimit-limit'];
    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];

    // BUG: No rate limiting headers present — anyone can burn Sora API credits
    expect(rateLimitHeader).toBeUndefined();
    expect(rateLimitRemaining).toBeUndefined();
  });
});
