import { test, expect } from '@playwright/test'

test.describe('Kongamano E2E Suite', () => {
  test('should load the home page and title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/Kongamano/i)
  })

  test('should load the scan station and render core scanner UI', async ({ page }) => {
    // Inject auth token for scan station
    await page.context().addCookies([
      { name: 'token', value: 'test-token-e2e', domain: 'localhost', path: '/' }
    ])

    await page.goto('/scan', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1.brand-title')).toContainText('Kongamano Scan Station')
    await expect(page.locator('.camera-wrapper')).toBeVisible()
    await expect(page.locator('input[placeholder*="Badge QR Code"]')).toBeVisible()
  })

  test('should pre-populate URL scan code cleanly', async ({ page }) => {
    await page.context().addCookies([
      { name: 'token', value: 'test-token-e2e', domain: 'localhost', path: '/' }
    ])

    await page.goto('/scan?code=D-20260818-10000', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.brand-title')).toBeVisible()
  })
})
