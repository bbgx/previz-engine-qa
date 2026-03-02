import { test, expect } from '@playwright/test';
import { API_ENDPOINTS, PROMPTS, CHEAP_VIDEO_PAYLOAD } from '../data';

test.describe('Generation Pipeline API', () => {
  test('POST /api/generate-video with valid payload returns 200 + taskId @api @smoke @regression', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
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
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: '' },
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/video-status without taskId returns 400 @api @smoke', async ({ request }) => {
    const response = await request.get(API_ENDPOINTS.videoStatus);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('taskId');
  });

  test('GET /api/video-status with valid taskId returns status object @api', async ({ request }) => {
    const historyResponse = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=1`);
    const historyBody = await historyResponse.json();
    const taskId = historyBody.videos?.[0]?.task_id;

    expect(taskId).toBeTruthy();

    const response = await request.get(`${API_ENDPOINTS.videoStatus}?taskId=${taskId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('taskId');
    expect(body).toHaveProperty('state');
  });

  test('GET /api/video-history returns videos array with expected shape @api @smoke @regression', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=5`);

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
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=mine&limit=5`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('videos');
  });
});

test.describe('Generation Pipeline — Data Integrity', () => {
  test('video history should have valid aspect_ratio values @api @regression', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=100`);
    const body = await response.json();

    const invalidVideos = body.videos.filter(
      (v: { aspect_ratio: string }) => v.aspect_ratio === 'INVALID_VALUE',
    );

    expect(invalidVideos.length).toBe(0);
  });

  test('video-status should return sanitized error for invalid taskId @api @regression', async ({ request }) => {
    test.fail(true, 'BUG-004: video-status leaks internal Sora API error structure');
    const response = await request.get(`${API_ENDPOINTS.videoStatus}?taskId=invalid-task-123`);

    expect(response.status()).toBe(400);
  });

  test('generate-video should include rate limiting headers @api @regression', async ({ request }) => {
    test.fail(true, 'BUG-002: no rate limiting on generation endpoint');
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: {
        prompt: PROMPTS.simple,
        ...CHEAP_VIDEO_PAYLOAD,
      },
    });

    const rateLimitHeader = response.headers()['x-ratelimit-limit'];
    expect(rateLimitHeader).toBeDefined();
  });

  test('innocent short prompts should not be flagged by moderation @api @regression', async ({ request }) => {
    test.fail(true, 'BUG-001: Sora moderation produces false positives on innocuous prompts');
    const allVideos = [];
    for (let offset = 0; offset < 300; offset += 100) {
      const res = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=100&offset=${offset}`);
      const page = await res.json();
      allVideos.push(...page.videos);
    }

    const falsePositives = allVideos.filter(
      (v: { status: string; prompt: string }) =>
        v.status === 'failed' && v.prompt.length < 20,
    );

    expect(falsePositives.length).toBe(0);
  });
});
