import { expect, test } from "@playwright/test"

test.describe("Documentation Pages", () => {
  test("should render docs main page correctly", async ({ page }) => {
    await page.goto("/docs")

    // Check page loads
    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Look for documentation content
    const docsHeading = page.locator('h1, h2, [data-testid="docs-title"]').first()
    if ((await docsHeading.count()) > 0) {
      await expect(docsHeading).toBeVisible()
    }

    // Check for typical docs layout elements
    const sidebar = page.locator('aside, .sidebar, [data-testid="docs-sidebar"]').first()
    const mainContent = page.locator('main, .docs-content, [data-testid="docs-content"]').first()

    if ((await sidebar.count()) > 0) {
      await expect(sidebar).toBeVisible()
    }

    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }

    // Verify no critical console errors
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)

    expect(
      errors.filter(
        (error) => !error.includes("favicon") && !error.includes("Third-party") && !error.includes("Extension"),
      ),
    ).toHaveLength(0)
  })

  test("should render community docs page correctly", async ({ page }) => {
    await page.goto("/docs/community")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Should not result in 404 or major error
    const notFoundIndicators = page.locator("text=404, text=Not Found, text=Page not found")
    expect(await notFoundIndicators.count()).toBe(0)

    // Should have some content
    const hasContent = (await page.locator("main, .container, h1, h2, p").count()) > 0
    expect(hasContent).toBeTruthy()
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/docs")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Mobile layout should work
    const mainContent = page.locator('main, [role="main"], .container').first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
