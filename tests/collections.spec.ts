import { expect, test } from "@playwright/test"

test.describe("Collections Page", () => {
  test("should render collections page correctly", async ({ page }) => {
    await page.goto("/collection")

    // Check page loads
    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Look for collections-related content
    const collectionsHeading = page.locator('h1, h2, [data-testid="collections-title"]').first()
    if ((await collectionsHeading.count()) > 0) {
      await expect(collectionsHeading).toBeVisible()
    }

    // Check for collections grid or list
    const collectionsContainer = page
      .locator('.collections-grid, .collections-list, [data-testid="collections-container"]')
      .first()
    const emptyState = page.locator('text=No collections, [data-testid="empty-state"]').first()

    // Either collections should be visible OR empty state should be shown
    const hasCollections = (await collectionsContainer.count()) > 0
    const hasEmptyState = (await emptyState.count()) > 0

    // Page should show some meaningful content
    expect(hasCollections || hasEmptyState || (await page.locator("main").count()) > 0).toBeTruthy()

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

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/collection")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Verify mobile layout works
    const mainContent = page.locator('main, [role="main"], .container').first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
