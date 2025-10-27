import { expect, test } from "@playwright/test"

test.describe("Home Page", () => {
  test("should render homepage correctly", async ({ page }) => {
    await page.goto("/")

    // Check page title
    await expect(page).toHaveTitle(/BioContextAI/)

    // Check main heading
    await expect(page.locator("h1")).toContainText("BioContextAI")

    // Check that main navigation elements are present
    await expect(page.locator("nav, #mobile-nav").first()).toBeVisible()

    // Check hero section content
    await expect(page.locator("text=Model Context Protocol servers")).toBeVisible()

    // Check main CTA buttons
    await expect(page.locator("text=Explore Registry")).toBeVisible()
    await expect(page.locator("text=View on GitHub")).toBeVisible()

    // Verify no console errors (common rendering issues)
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle")

    // Check that there are no critical console errors
    expect(
      errors.filter(
        (error) => !error.includes("favicon") && !error.includes("Third-party") && !error.includes("Extension"),
      ),
    ).toHaveLength(0)
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")

    // Check that mobile navigation works
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("h1")).toHaveText("BioContextAI")

    // Check that buttons stack properly on mobile
    const ctaSection = page.locator("text=Explore Registry").locator("..")
    await expect(ctaSection).toBeVisible()
  })

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/")

    // Test registry link
    await page.click("text=Explore Registry")
    await expect(page).toHaveURL("/registry")
    await page.goBack()

    // Test GitHub link (opens in new tab)
    const [newPage] = await Promise.all([page.waitForEvent("popup"), page.click("text=View on GitHub")])
    expect(newPage.url()).toContain("github.com/biocontext-ai")
    await newPage.close()
  })
})
