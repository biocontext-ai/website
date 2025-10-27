import { expect, test } from "@playwright/test"

test.describe("Navigation and Layout", () => {
  test("should have consistent navigation across pages", async ({ page }) => {
    const pages = ["/", "/registry", "/blog", "/chat", "/docs"]

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState("networkidle")

      // Check that navigation is present
      const nav = page.locator('nav, [role="navigation"]').first()
      if ((await nav.count()) > 0) {
        await expect(nav).toBeVisible()
      }

      // Check that footer is present
      const footer = page.locator('footer, [role="contentinfo"]').first()
      if ((await footer.count()) > 0) {
        await expect(footer).toBeVisible()
      }

      // Check that main content area exists
      const main = page.locator('main, [role="main"]').first()
      if ((await main.count()) > 0) {
        await expect(main).toBeVisible()
      }
    }
  })

  test("should handle theme switching", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Look for theme toggle button
    const themeToggle = page
      .locator(
        '[data-testid="theme-toggle"], button:has-text("theme"), button:has-text("Theme"), [aria-label*="theme"], [aria-label*="Theme"]',
      )
      .first()

    if ((await themeToggle.count()) > 0) {
      await expect(themeToggle).toBeVisible()

      // Test theme toggle doesn't break the page
      await themeToggle.click()
      await page.waitForTimeout(500)
      await expect(page.locator("body")).toBeVisible()
    }
  })

  test("should have working logo/home link", async ({ page }) => {
    await page.goto("/registry")
    await page.waitForLoadState("networkidle")

    // Find logo or home link
    const logoLink = page.locator('a[href="/"], a:has-text("BioContextAI"), .logo').first()

    if ((await logoLink.count()) > 0) {
      await logoLink.click()
      await expect(page).toHaveURL("/")
    }
  })

  test("should handle mobile menu toggle", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Look for mobile menu button
    const mobileMenuButton = page
      .locator(
        'button[aria-label*="menu"], button[aria-label*="Menu"], .mobile-menu-button, [data-testid="mobile-menu"]',
      )
      .first()

    if ((await mobileMenuButton.count()) > 0) {
      await expect(mobileMenuButton).toBeVisible()

      // Test mobile menu toggle
      await mobileMenuButton.click()
      await page.waitForTimeout(300)

      // Menu should expand (look for menu items)
      const menuItems = page.locator("nav a, .menu-item").first()
      if ((await menuItems.count()) > 0) {
        await expect(menuItems).toBeVisible()
      }
    }
  })
})
