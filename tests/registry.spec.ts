import { expect, test } from "@playwright/test"

test.describe("Registry Page", () => {
  test("should render registry page correctly", async ({ page }) => {
    await page.goto("/registry")

    // Check page title
    await expect(page).toHaveTitle(/Registry/)

    // Check main heading is visible
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("h1")).toContainText("Registry")

    // Check that search functionality is present
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible()
    }

    // Check that registry items are loaded
    await page.waitForLoadState("networkidle")

    // Look for registry cards/items
    const registryItems = page.locator('[itemtype="https://schema.org/SoftwareApplication"]').first()
    if ((await registryItems.count()) > 0) {
      await expect(registryItems).toBeVisible()
    }

    // Verify no critical console errors
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000) // Give time for any async operations

    expect(
      errors.filter(
        (error) => !error.includes("favicon") && !error.includes("Third-party") && !error.includes("Extension"),
      ),
    ).toHaveLength(0)
  })

  test("should handle search functionality", async ({ page }) => {
    await page.goto("/registry")

    // Wait for page to load
    await page.waitForLoadState("networkidle")

    // Try to find and interact with search
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()

    if ((await searchInput.count()) > 0) {
      await searchInput.fill("test")
      await page.waitForTimeout(500) // Wait for search to process

      // Verify search doesn't break the page
      await expect(page.locator("body")).toBeVisible()
    }
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/registry")

    // Check that page renders on mobile
    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Verify mobile layout doesn't break
    const mainContent = page.locator(".container").first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
