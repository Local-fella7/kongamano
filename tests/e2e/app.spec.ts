import { test, expect } from '@playwright/test'

test.describe('Kongamano E2E Suite', () => {
  test('should load the page and title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/Kongamano/i)
  })
})
