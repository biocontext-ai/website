import { expect, test } from "@playwright/test"

test.describe("Chat Page", () => {
  test("should render chat page correctly for unauthenticated users", async ({ page }) => {
    await page.goto("/chat")

    // Check page loads
    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Should show sign-in required message for unauthenticated users
    const signInMessage = page.locator("text=Sign in required").first()

    // Either show sign-in prompt or chat interface
    const chatInterface = page.locator("#chat, textarea").first()

    const hasSignIn = (await signInMessage.count()) > 0
    const hasChat = (await chatInterface.count()) > 0

    // Should have either sign-in message or chat interface
    expect(hasSignIn || hasChat).toBeTruthy()

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
        (error) =>
          !error.includes("favicon") &&
          !error.includes("Third-party") &&
          !error.includes("Extension") &&
          !error.includes("fetch"), // API calls might fail in test env
      ),
    ).toHaveLength(0)
  })

  test("should handle chat interface elements", async ({ page }) => {
    await page.goto("/chat")
    await page.waitForLoadState("networkidle")

    // Look for typical chat elements
    const chatInput = page
      .locator('textarea, input[type="text"], [placeholder*="message"], [placeholder*="chat"]')
      .first()
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), [aria-label*="send"]').first()

    // If chat interface is present, verify basic elements
    if ((await chatInput.count()) > 0) {
      await expect(chatInput).toBeVisible()

      if ((await sendButton.count()) > 0) {
        await expect(sendButton).toBeVisible()
      }
    }
  })

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/chat")

    await expect(page.locator("body")).toBeVisible()
    await page.waitForLoadState("networkidle")

    // Verify mobile layout works
    const mainContent = page.locator('main, [role="main"], .container, .chat-container').first()
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toBeVisible()
    }
  })
})
