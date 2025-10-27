import { expect, test } from "@playwright/test"

test.describe("Performance and Accessibility", () => {
  test("should have good performance metrics", async ({ page }) => {
    await page.goto("/")

    // Measure loading performance
    const performanceTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByType("paint").find((entry) => entry.name === "first-contentful-paint")?.startTime ||
          0,
      }
    })

    // Basic performance expectations
    expect(performanceTiming.domContentLoaded).toBeLessThan(5000) // 5 seconds
    expect(performanceTiming.firstContentfulPaint).toBeLessThan(3000) // 3 seconds
  })

  test("should have basic accessibility features", async ({ page }) => {
    await page.goto("/")

    // Check for basic accessibility elements
    const hasMainLandmark = (await page.locator('main, [role="main"]').count()) > 0
    const hasNavLandmark = (await page.locator('nav, [role="navigation"]').count()) > 0
    const hasHeadings = (await page.locator("h1, h2, h3").count()) > 0

    expect(hasMainLandmark || hasNavLandmark || hasHeadings).toBeTruthy()
  })

  test("should handle keyboard navigation", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit has different keyboard navigation behavior")

    await page.goto("/")

    // Test tab navigation
    await page.keyboard.press("Tab")
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)

    // Should be able to focus on interactive elements
    expect(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(focusedElement || "")).toBeTruthy()
  })

  test("should work with reduced motion preferences", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
    })
    const page = await context.newPage()

    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()

    // Page should still function with reduced motion
    const mainContent = page.locator("main, h1").first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }

    await context.close()
  })

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/")

    // Check for essential meta tags
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)

    const description = await page.locator('meta[name="description"]').getAttribute("content")
    if (description) {
      expect(description.length).toBeGreaterThan(0)
    }

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content")
    expect(viewport).toContain("width=device-width")
  })
})
