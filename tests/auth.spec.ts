import { expect, test } from "@playwright/test"

test.describe("Authentication Flow", () => {
  test("should handle auth pages correctly", async ({ page }) => {
    // Test sign-in page
    await page.goto("/signin")
    await expect(page.locator("body")).toBeVisible()

    // Should show sign-in form or providers
    const signInForm = page.locator('form, button:has-text("Sign"), button:has-text("Login")').first()
    if ((await signInForm.count()) > 0) {
      await expect(signInForm).toBeVisible()
    }
  })

  test("should handle protected routes", async ({ page }) => {
    // Test that protected routes redirect to sign-in or show appropriate message
    const protectedRoutes = ["/chat", "/collection"]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForLoadState("networkidle")

      // Should either show sign-in requirement or allow access
      await expect(page.locator("body")).toBeVisible()

      // Should not show unhandled auth errors
      const unhandledErrors = page.locator("text=Unauthorized, text=Access denied")
      const errorCount = await unhandledErrors.count()
      expect(errorCount).toBeLessThan(1)
    }
  })

  test("Basic auth - credentials login and user name display", async ({ page, browser }) => {
    // Skip test if not in development environment or password not provided
    if (process.env.NODE_ENV === "production") {
      test.skip(true, "Test only runs in test and development environment")
    }

    const testPassword = process.env.TEST_PASSWORD || "password"

    await test.step("should login with credentials", async () => {
      await page.goto("/signin")
      await page.waitForLoadState("networkidle")

      // Check if credentials form is visible (only in development)
      const passwordField = page.locator('input[type="password"]').first()
      expect((await passwordField.count()) > 0).toBeTruthy()

      await passwordField.fill(testPassword)
      await page.getByRole("button", { name: "Sign In with Test Credentials" }).click()

      // Wait for redirect to home page
      await page.waitForURL("/")

      // Also check in the dropdown menu
      const userButton = page.locator('button[class*="rounded-full"]').first()
      await userButton.click()

      // Check user name and email in dropdown
      await expect(page.locator('p:has-text("Test User")')).toBeVisible()
      await expect(page.locator('p:has-text("test@example.com")')).toBeVisible()

      // Close dropdown
      await page.keyboard.press("Escape")
    })
  })
})
