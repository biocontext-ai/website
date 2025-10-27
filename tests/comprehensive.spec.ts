import { expect, test } from "@playwright/test"
import { TEST_DATA, TestHelpers } from "./test-helpers"

test.describe("Comprehensive Page Rendering Tests", () => {
  test.describe("All Main Pages", () => {
    TEST_DATA.COMMON_PAGES.forEach(({ path, name }) => {
      test(`should render ${name} page correctly`, async ({ page }) => {
        await page.goto(path)
        await TestHelpers.waitForPageLoad(page)

        // Basic page structure
        await expect(page.locator("body")).toBeVisible()
        await TestHelpers.checkBasicPageStructure(page)

        // Check for loading states
        await TestHelpers.checkLoadingStates(page, path)

        // Check console errors
        await TestHelpers.checkNoConsoleErrors(page, TEST_DATA.ALLOWED_CONSOLE_ERRORS)
      })

      test(`should be responsive - ${name}`, async ({ page }) => {
        await TestHelpers.checkResponsiveLayout(page, path)
      })
    })
  })

  test.describe("Legal Pages", () => {
    TEST_DATA.LEGAL_PAGES.forEach(({ path, name }) => {
      test(`should render ${name} correctly`, async ({ page }) => {
        await page.goto(path)
        await TestHelpers.waitForPageLoad(page)

        await expect(page.locator("body")).toBeVisible()

        // Should not be 404
        const notFoundIndicators = page.locator("text=404, text=Not Found, text=Page not found")
        expect(await notFoundIndicators.count()).toBe(0)

        // Should have content
        const hasContent = (await page.locator("h1, h2, p, main").count()) > 0
        expect(hasContent).toBeTruthy()
      })
    })
  })

  test.describe("Dynamic Routes", () => {
    test("should handle registry item pages", async ({ page }) => {
      // First go to registry to see if there are any items
      await page.goto("/registry")
      await TestHelpers.waitForPageLoad(page)

      // Look for registry item links
      const itemLinks = page.locator('a[href^="/registry/"]')
      const linkCount = await itemLinks.count()

      if (linkCount > 0) {
        // Test first registry item link
        const firstLink = itemLinks.first()
        const href = await firstLink.getAttribute("href")

        if (href) {
          await page.goto(href)
          await TestHelpers.waitForPageLoad(page)
          await expect(page.locator("body")).toBeVisible()
        }
      }
    })

    test("should handle blog post pages", async ({ page }) => {
      // First go to blog to see if there are any posts
      await page.goto("/blog")
      await TestHelpers.waitForPageLoad(page)

      // Look for blog post links
      const postLinks = page.locator('a[href^="/blog/"]')
      const linkCount = await postLinks.count()

      if (linkCount > 0) {
        // Test first blog post link
        const firstLink = postLinks.first()
        const href = await firstLink.getAttribute("href")

        if (href && !href.includes("/create") && !href.includes("/edit")) {
          await page.goto(href)
          await TestHelpers.waitForPageLoad(page)
          await expect(page.locator("body")).toBeVisible()
        }
      }
    })
  })
})
