import { test, expect } from '@playwright/test';
import { API_ENDPOINTS, PROMPTS_EDGE } from '../data';

test.describe('Prompt Edge Cases — Security & Encoding', () => {
  test('SQL injection string is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.sqlInjection, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS script tag is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.xssScript, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS img tag is accepted without server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.xssImg, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
  });

  test('XSS payload is not reflected raw in history @api @security', async ({ request }) => {
    const response = await request.get(`${API_ENDPOINTS.videoHistory}?filter=all&limit=100`);
    const body = await response.json();
    const rawText = JSON.stringify(body);
    expect(rawText).not.toContain('<script>alert');
  });

  test('unicode prompt is accepted @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.unicode, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('taskId');
    }
  });

  test('emoji prompt is accepted @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.emoji, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect([200, 400]).toContain(response.status());
  });

  test('whitespace-only prompt returns 400 @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.whitespaceOnly, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).toBe(400);
  });

  test('very long prompt is handled without 500 @api', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.veryLong, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
  });

  test('path traversal in prompt does not cause server error @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.pathTraversal, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
  });

  test('template literal in prompt does not leak env vars @api @security', async ({ request }) => {
    const response = await request.post(API_ENDPOINTS.generateVideo, {
      data: { prompt: PROMPTS_EDGE.templateLiteral, n_variants: 1, aspect_ratio: 'landscape', duration: '8' },
    });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(JSON.stringify(body)).not.toMatch(/sk-|secret|password/i);
    }
  });
});
