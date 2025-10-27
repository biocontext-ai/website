import { expect, test } from "@playwright/test"

test.describe("API Health Checks", () => {
  test("should have working health endpoint", async ({ request }) => {
    const response = await request.get("/api/health")
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty("status")
  })
})
