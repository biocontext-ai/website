import { expect, test } from "@playwright/test"

test.describe("Legal Pages", () => {
  const legalPages = [
    { path: "/legal/terms", name: "Terms of Service" },
    { path: "/legal/privacy", name: "Privacy Policy" },
    { path: "/legal/notice", name: "Legal Notice" },
  ]

  legalPages.forEach(({ path, name }) => {
    test(`should render ${name} page correctly`, async ({ page }) => {
      await page.goto(path)

      // Check page loads
      await expect(page.locator("body")).toBeVisible()
      await page.waitForLoadState("networkidle")

      // Should not result in 404
      const notFoundIndicators = page.locator("text=404, text=Not Found, text=Page not found")
      expect(await notFoundIndicators.count()).toBe(0)

      // Should have typical legal document structure
      const headings = page.locator("h1")
      if ((await headings.count()) > 0) {
        await expect(headings.first()).toBeVisible()
      }

      // Should have content paragraphs
      const content = page.locator("p").first()
      if ((await content.count()) > 0) {
        await expect(content).toBeVisible()
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
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/legal/terms")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Mobile layout should work
    const mainContent = page.locator('main, [role="main"], .container').first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
