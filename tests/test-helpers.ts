import { test as baseTest, expect } from "@playwright/test"

// Test utilities and helpers
export const test = baseTest.extend({
  // Add custom fixtures here if needed
})

export { expect }

// Helper functions for common test operations
export class TestHelpers {
  static async waitForPageLoad(page: any) {
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(500) // Small buffer for dynamic content
  }

  static async checkNoConsoleErrors(page: any, allowedErrors: string[] = []) {
    const errors: string[] = []
    page.on("console", (msg: any) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    await this.waitForPageLoad(page)

    const filteredErrors = errors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("Third-party") &&
        !error.includes("Extension") &&
        !allowedErrors.some((allowed) => error.includes(allowed)),
    )

    expect(filteredErrors).toHaveLength(0)
  }

  static async checkResponsiveLayout(page: any, url: string) {
    const viewports = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1920, height: 1080, name: "Desktop" },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(url)
      await this.waitForPageLoad(page)

      await expect(page.locator("body")).toBeVisible()

      const mainContent = page.locator("main, .container, h1").first()
      if ((await mainContent.count()) > 0) {
        await expect(mainContent).toBeVisible()
      }
    }
  }

  static async checkBasicPageStructure(page: any) {
    // Check for semantic HTML structure
    const hasHeader = (await page.locator('header, nav, [role="navigation"]').count()) > 0
    const hasMain = (await page.locator('main, [role="main"]').count()) > 0
    const hasFooter = (await page.locator('footer, [role="contentinfo"]').count()) > 0
    const hasHeadings = (await page.locator("h1, h2, h3").count()) > 0

    // At least some structural elements should be present
    expect(hasHeader || hasMain || hasFooter || hasHeadings).toBeTruthy()
  }

  static async checkLoadingStates(page: any, url: string) {
    await page.goto(url)

    // Check that page shows some content quickly
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 })

    // Check for loading indicators
    const loadingIndicators = page.locator('text=Loading, .loading, [data-testid="loading"], .spinner')
    if ((await loadingIndicators.count()) > 0) {
      // If loading indicators are present, they should eventually disappear
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 30000 })
    }

    await this.waitForPageLoad(page)
  }
}

// Common test data
export const TEST_DATA = {
  COMMON_PAGES: [
    { path: "/", name: "Home" },
    { path: "/registry", name: "Registry" },
    { path: "/blog", name: "Blog" },
    { path: "/chat", name: "Chat" },
    { path: "/docs", name: "Documentation" },
  ],

  LEGAL_PAGES: [
    { path: "/legal/terms", name: "Terms of Service" },
    { path: "/legal/privacy", name: "Privacy Policy" },
    { path: "/legal/notice", name: "Legal Notice" },
  ],

  ALLOWED_CONSOLE_ERRORS: [
    "favicon",
    "Third-party",
    "Extension",
    "Failed to load resource", // Common in test environments
    "net::ERR_INTERNET_DISCONNECTED", // Network simulation errors
  ],
}
