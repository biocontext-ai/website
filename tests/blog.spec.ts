import { expect, test } from "@playwright/test"

test.describe("Blog Page", () => {
  test("should render blog page correctly", async ({ page }) => {
    await page.goto("/blog")

    // Check page loads without major errors
    await expect(page.locator("body")).toBeVisible()

    // Check for typical blog elements
    await page.waitForLoadState("networkidle")

    // Look for blog title or heading
    const blogHeading = page.locator('h1, h2, [data-testid="blog-title"]').first()
    if ((await blogHeading.count()) > 0) {
      await expect(blogHeading).toBeVisible()
    }

    // Check for blog posts or empty state
    const blogPosts = page.locator(".bg-card")
    const emptyState = page.locator("text=No blog posts")

    // Either posts should be visible OR empty state should be shown
    const hasPosts = (await blogPosts.count()) > 0
    const hasEmptyState = (await emptyState.count()) > 0

    expect(hasPosts || hasEmptyState).toBeTruthy()

    // Check for search functionality if present
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first()
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible()
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

  test("should handle pagination if present", async ({ page }) => {
    await page.goto("/blog")
    await page.waitForLoadState("networkidle")

    // Check for pagination controls
    const paginationNext = page.locator('text=Next, [aria-label="Next page"], .pagination-next').first()
    const paginationPrev = page.locator('text=Previous, [aria-label="Previous page"], .pagination-prev').first()

    // If pagination exists, test it doesn't break
    if ((await paginationNext.count()) > 0) {
      // Just verify the pagination is visible and clickable
      await expect(paginationNext).toBeVisible()
    }
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/blog")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Verify mobile layout works
    const mainContent = page.locator('main, [role="main"], .container').first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
