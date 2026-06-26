import { test, expect } from '@playwright/test'

test.describe('page load', () => {
  test('has title and dark background', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Disaster Radio')
    // Black background from bundle.js CSS injection
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    expect(bg).toBe('rgb(0, 0, 0)')
  })

  test('shows chat input and send button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#chatInput')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('connects to WebSocket and receives welcome message', async ({ page }) => {
    await page.goto('/')
    // Dev server sends a welcome-style message from cookie_cat within 5s
    await expect(page.locator('.remote')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('joining', () => {
  test('entering a name and pressing Enter shows join status message', async ({ page }) => {
    await page.goto('/')
    await page.locator('#chatInput').fill('testuser')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.status')).toContainText('testuser', { timeout: 5000 })
  })

  test('entering a name and clicking Send shows join status message', async ({ page }) => {
    await page.goto('/')
    await page.locator('#chatInput').fill('testuser')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.status')).toContainText('testuser', { timeout: 5000 })
  })

  test('clears the input after joining', async ({ page }) => {
    await page.goto('/')
    await page.locator('#chatInput').fill('testuser')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.status')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#chatInput')).toHaveValue('')
  })
})

test.describe('chatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#chatInput').fill('testuser')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.status')).toBeVisible({ timeout: 5000 })
  })

  test('sending a message shows it as "self" in the chat', async ({ page }) => {
    await page.locator('#chatInput').fill('hello disaster radio')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.self')).toContainText('hello disaster radio', { timeout: 5000 })
  })

  test('sent message includes the username', async ({ page }) => {
    await page.locator('#chatInput').fill('greetings')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.self')).toContainText('testuser', { timeout: 5000 })
  })

  test('clears the input after sending', async ({ page }) => {
    await page.locator('#chatInput').fill('hello')
    await page.locator('#chatInput').press('Enter')
    await expect(page.locator('.self')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#chatInput')).toHaveValue('')
  })

  test('whitespace-only message shows an error placeholder', async ({ page }) => {
    await page.locator('#chatInput').fill('   ')
    await page.locator('#chatInput').press('Enter')
    const placeholder = await page.locator('#chatInput').getAttribute('placeholder')
    expect(placeholder).toMatch(/non-whitespace/i)
  })
})

test.describe('route table', () => {
  test('shows nearby nodes count', async ({ page }) => {
    await page.goto('/')
    // Dev server broadcasts a route table within 5s of connect
    await expect(page.locator('.routes-header')).toContainText('nodes nearby', { timeout: 8000 })
  })

  test('shows node MAC address and signal strength', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.route-mac').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.route-signal').first()).toContainText('[')
  })
})
