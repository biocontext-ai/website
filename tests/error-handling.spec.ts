import { expect, test } from "@playwright/test"

test.describe("Error Handling and Edge Cases", () => {
  test("should handle 404 pages gracefully", async ({ page }) => {
    await page.goto("/this-page-does-not-exist")

    // Should show our custom 404 page
    await expect(page.locator("body")).toBeVisible()

    // Check for our custom 404 page elements
    await expect(page.locator("text=Page Not Found")).toBeVisible()

    // Check that helpful navigation options are present
    await expect(page.locator("text=Go to Homepage")).toBeVisible()
    await expect(page.locator("text=Browse Registry")).toBeVisible()

    // Verify navigation links work
    const homeLink = page.locator('a[href="/"]').first()
    await expect(homeLink).toBeVisible()

    const registryLink = page.locator('a[href="/registry"]').first()
    await expect(registryLink).toBeVisible()
  })

  test("should handle invalid registry items", async ({ page }) => {
    await page.goto("/registry/invalid-item-that-does-not-exist")

    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(5000)
    await expect(page.locator("body")).toBeVisible()

    // Should show error message or redirect gracefully
    const errorHandled = (await page.locator("text=Server Not Found").count()) > 0
    expect(errorHandled).toBeTruthy()
  })

  test("should handle network errors gracefully", async ({ page, context }) => {
    // Block all network requests to simulate offline
    await context.route("**/*", (route) => {
      if (route.request().url().includes("/api/")) {
        route.abort()
      } else {
        route.continue()
      }
    })

    await page.goto("/")

    // Page should still render basic layout
    await expect(page.locator("body")).toBeVisible()

    // Should not show unhandled JavaScript errors
    const jsErrors: string[] = []
    page.on("pageerror", (error) => {
      jsErrors.push(error.message)
    })

    await page.waitForTimeout(2000)

    // Filter out expected network errors
    const unexpectedErrors = jsErrors.filter(
      (error) => !error.includes("fetch") && !error.includes("network") && !error.includes("Failed to fetch"),
    )

    expect(unexpectedErrors).toHaveLength(0)
  })

  test("should handle JavaScript disabled gracefully", async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
    })
    const page = await context.newPage()

    await page.goto("/")

    // Basic HTML should still render
    await expect(page.locator("body")).toBeVisible()
    await expect(page.locator("h1").first()).toBeVisible()

    await context.close()
  })

  test("should handle large viewport sizes", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto("/")

    await expect(page.locator("body")).toBeVisible()

    // Content should not be broken on large screens
    const mainContent = page.locator("main, .container").first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })

  test("should handle very small viewport sizes", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/")

    await expect(page.locator("body")).toBeVisible()

    // Content should still be readable on very small screens
    const heading = page.locator("h1").first()
    if ((await heading.count()) > 0) {
      await expect(heading).toBeVisible()
    }
  })

  test("should have functional navigation on 404 page", async ({ page }) => {
    await page.goto("/non-existent-page")

    // Test homepage navigation
    await page.click("text=Go to Homepage")
    await expect(page).toHaveURL("/")

    // Go back to 404 page
    await page.goto("/another-non-existent-page")

    // Test registry navigation
    await page.click("text=Browse Registry")
    await expect(page).toHaveURL("/registry")

    // Go back to 404 page
    await page.goto("/yet-another-non-existent-page")

    // Test docs navigation
    await page.click("text=Go to Homepage")
    await expect(page).toHaveURL("/")
  })
})
