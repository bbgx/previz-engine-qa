import { test, expect } from '../fixtures';

test.describe('Security Headers Audit', () => {
  test('response includes Content-Security-Policy header @api @security', async ({ request }) => {
    test.fail(true, 'BUG-005: no Content-Security-Policy header set');
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'];
    expect(csp, 'CSP header should be set').toBeDefined();
  });

  test('response includes X-Content-Type-Options: nosniff @api @security', async ({ request }) => {
    test.fail(true, 'BUG-005: no X-Content-Type-Options header set');
    const response = await request.get('/');
    const header = response.headers()['x-content-type-options'];
    expect(header).toBe('nosniff');
  });

  test('response includes X-Frame-Options @api @security', async ({ request }) => {
    test.fail(true, 'BUG-005: no X-Frame-Options header set');
    const response = await request.get('/');
    const header = response.headers()['x-frame-options'];
    expect(header, 'X-Frame-Options should be DENY or SAMEORIGIN').toBeDefined();
  });

  test('response includes Strict-Transport-Security @api @security', async ({ request }) => {
    const response = await request.get('/');
    const hsts = response.headers()['strict-transport-security'];
    expect(hsts, 'HSTS header should be set').toBeDefined();
  });

  test('previz_user_id cookie has Secure flag @security', async ({ page }) => {
    test.fail(true, 'BUG-005: cookie missing Secure flag');
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    const cookies = await page.context().cookies();
    const userCookie = cookies.find((c) => c.name === 'previz_user_id');
    expect(userCookie, 'previz_user_id cookie should exist').toBeDefined();
    expect(userCookie!.secure, 'Cookie should have Secure flag').toBe(true);
  });

  test('previz_user_id cookie has HttpOnly flag @security', async ({ page }) => {
    test.fail(true, 'BUG-005: cookie missing HttpOnly flag');
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    const cookies = await page.context().cookies();
    const userCookie = cookies.find((c) => c.name === 'previz_user_id');
    expect(userCookie, 'previz_user_id cookie should exist').toBeDefined();
    expect(userCookie!.httpOnly, 'Cookie should have HttpOnly flag').toBe(true);
  });

  test('previz_user_id cookie has SameSite attribute @security', async ({ page }) => {
    test.skip(test.info().project.name === 'firefox', 'Firefox reports SameSite differently when server does not set it explicitly');
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    const cookies = await page.context().cookies();
    const userCookie = cookies.find((c) => c.name === 'previz_user_id');
    expect(userCookie, 'previz_user_id cookie should exist').toBeDefined();
    expect(
      ['Strict', 'Lax'].includes(userCookie!.sameSite),
      `Cookie SameSite should be Strict or Lax, got: ${userCookie!.sameSite}`,
    ).toBe(true);
  });

  test('API endpoints do not expose server version headers @api @security', async ({ request }) => {
    const response = await request.get('/api/video-history?filter=all&limit=1');
    const poweredBy = response.headers()['x-powered-by'];
    expect(poweredBy, 'X-Powered-By should not be set').toBeUndefined();
  });
});
