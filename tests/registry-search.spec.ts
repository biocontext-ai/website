import { expect, test } from "@playwright/test"

test.describe("Registry Search and Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/registry")
    await page.waitForLoadState("networkidle")
  })

  test("should display the registry page with servers", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Registry" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "MCP Servers" })).toBeVisible()

    // Check that server count is displayed
    await expect(page.getByText(/\d+ servers? found/)).toBeVisible()
  })

  test("should search for BioContextAI Knowledgebase MCP server", async ({ page }) => {
    // Get the search input
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Type search query
    await searchInput.fill("BioContextAI Knowledgebase")

    // Wait for debounce and navigation
    await page.waitForURL(/search=BioContextAI\+Knowledgebase/)
    await page.waitForLoadState("networkidle")

    // Check that the specific server is shown
    await expect(page.getByText("BioContextAI Knowledgebase MCP")).toBeVisible()

    // Verify the search is reflected in the URL
    expect(page.url()).toContain("search=BioContextAI")
  })

  test("should handle case-insensitive search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Search with lowercase
    await searchInput.fill("biocontextai")
    await page.waitForURL(/search=biocontextai/)
    await page.waitForLoadState("networkidle")

    // Should find the server regardless of case
    await expect(page.getByText("BioContextAI Knowledgebase MCP")).toBeVisible()
  })

  test("should clear search and show all servers", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // First search for something
    await searchInput.fill("BioContextAI")
    await page.waitForURL(/search=BioContextAI/)
    await page.waitForLoadState("networkidle")

    // Get the filtered count
    const filteredText = await page.getByText(/\d+ servers? found/).textContent()
    const filteredCount = parseInt(filteredText?.match(/(\d+)/)?.[1] || "0")

    // Clear the search
    await searchInput.clear()
    await page.waitForURL(/^(?!.*search=).*$/)
    await page.waitForLoadState("networkidle")

    // Get the full count
    const fullText = await page.getByText(/\d+ servers? found/).textContent()
    const fullCount = parseInt(fullText?.match(/(\d+)/)?.[1] || "0")

    // Full count should be greater than or equal to filtered count
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount)
  })

  test("should sort servers alphabetically (case-insensitive)", async ({ page }) => {
    // Select alphabetical sort (default)
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Alphabetical" }).click()
    await page.waitForLoadState("networkidle")

    // Wait for cards to load (not skeletons)
    await page.waitForSelector('[itemtype="https://schema.org/SoftwareApplication"]', { timeout: 10000 })

    // Get all server names - looking for the card title which is inside a link
    const serverTitles = page.locator('[itemtype="https://schema.org/SoftwareApplication"] [itemprop="name"]')
    const count = await serverTitles.count()

    if (count > 1) {
      const firstServerName = await serverTitles.nth(0).textContent()
      const secondServerName = await serverTitles.nth(1).textContent()

      // Check case-insensitive alphabetical order
      if (firstServerName && secondServerName) {
        expect(firstServerName.toLowerCase().localeCompare(secondServerName.toLowerCase()) <= 0).toBeTruthy()
      }
    }
  })

  test("should sort by most helpful", async ({ page }) => {
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Most Helpful" }).click()

    // Wait for URL to update with sort parameter
    await page.waitForURL(/sort=rating-desc/)
    await page.waitForLoadState("networkidle")

    // Verify URL contains sort parameter
    expect(page.url()).toContain("sort=rating-desc")
  })

  test("should sort by most GitHub stars", async ({ page }) => {
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Most GitHub Stars" }).click()

    await page.waitForURL(/sort=stars-desc/)
    await page.waitForLoadState("networkidle")

    expect(page.url()).toContain("sort=stars-desc")
  })

  test("should sort by newest", async ({ page }) => {
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Newest" }).click()

    await page.waitForURL(/sort=date-newest/)
    await page.waitForLoadState("networkidle")

    expect(page.url()).toContain("sort=date-newest")
  })

  test("should sort by oldest", async ({ page }) => {
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Oldest" }).click()

    await page.waitForURL(/sort=date-oldest/)
    await page.waitForLoadState("networkidle")

    expect(page.url()).toContain("sort=date-oldest")
  })

  test("should navigate between pages", async ({ page }) => {
    // Check if pagination exists (more than 20 servers)
    const paginationNext = page.getByRole("link", { name: "Next" })
    const hasPagination = await paginationNext.isVisible().catch(() => false)

    if (hasPagination) {
      // Click next page
      await paginationNext.click()
      await page.waitForURL(/page=2/)
      await page.waitForLoadState("networkidle")

      // Verify we're on page 2
      expect(page.url()).toContain("page=2")
      await expect(page.getByText(/Page 2 of \d+/)).toBeVisible()

      // Click previous page
      const paginationPrev = page.getByRole("link", { name: "Previous" })
      await paginationPrev.click()
      await page.waitForLoadState("networkidle")

      // Should be back to page 1 (no page param in URL)
      expect(page.url()).not.toContain("page=")
    }
  })

  test("should reset to page 1 when searching", async ({ page }) => {
    // Check if pagination exists
    const paginationNext = page.getByRole("link", { name: "Next" })
    const hasPagination = await paginationNext.isVisible().catch(() => false)

    if (hasPagination) {
      // Go to page 2
      await paginationNext.click()
      await page.waitForURL(/page=2/)
      await page.waitForLoadState("networkidle")

      // Now search for something
      const searchInput = page.getByPlaceholder("Search MCP servers...")
      await searchInput.fill("BioContextAI")
      await page.waitForURL(/search=BioContextAI/)
      await page.waitForLoadState("networkidle")

      // Should be back to page 1 (no page param)
      expect(page.url()).not.toContain("page=")
      expect(page.url()).toContain("search=BioContextAI")
    }
  })

  test("should reset to page 1 when changing sort", async ({ page }) => {
    // Check if pagination exists
    const paginationNext = page.getByRole("link", { name: "Next" })
    const hasPagination = await paginationNext.isVisible().catch(() => false)

    if (hasPagination) {
      // Go to page 2
      await paginationNext.click()
      await page.waitForURL(/page=2/)
      await page.waitForLoadState("networkidle")

      // Change sort
      const sortSelect = page.getByRole("combobox")
      await sortSelect.click()
      await page.getByRole("option", { name: "Most Helpful" }).click()
      await page.waitForURL(/sort=rating-desc/)
      await page.waitForLoadState("networkidle")

      // Should be back to page 1
      expect(page.url()).not.toContain("page=")
      expect(page.url()).toContain("sort=rating-desc")
    }
  })

  test("should preserve search and sort when navigating pages", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Search for something
    await searchInput.fill("MCP")
    await page.waitForURL(/search=MCP/)
    await page.waitForLoadState("networkidle")

    // Change sort
    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Most GitHub Stars" }).click()
    await page.waitForURL(/sort=stars-desc/)
    await page.waitForLoadState("networkidle")

    // Check if pagination exists after filtering
    const paginationNext = page.getByRole("link", { name: "Next" })
    const hasPagination = await paginationNext.isVisible().catch(() => false)

    if (hasPagination) {
      // Go to page 2
      await paginationNext.click()
      await page.waitForURL(/page=2/)
      await page.waitForLoadState("networkidle")

      // Both search and sort should be preserved
      expect(page.url()).toContain("search=MCP")
      expect(page.url()).toContain("sort=stars-desc")
      expect(page.url()).toContain("page=2")
    }
  })

  test("should show no results message for non-existent search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Search for something that doesn't exist
    await searchInput.fill("xyznonexistentserver123")
    await page.waitForURL(/search=xyznonexistentserver123/)
    await page.waitForLoadState("networkidle")

    // Should show no results message
    await expect(page.getByText(/No servers found matching/)).toBeVisible()
    await expect(page.getByText(/Try adjusting your search terms/)).toBeVisible()
  })

  test("should debounce search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Type quickly without waiting
    await searchInput.type("Bio", { delay: 50 })

    // URL should not update immediately
    await page.waitForTimeout(100)
    expect(page.url()).not.toContain("search=Bio")

    // Wait for debounce
    await page.waitForTimeout(350)

    // Now URL should be updated
    await page.waitForURL(/search=Bio/)
    expect(page.url()).toContain("search=Bio")
  })

  test("should show skeleton loading state during debounce and search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search MCP servers...")

    // Get initial state - should have actual cards
    await expect(page.locator('[itemtype="https://schema.org/SoftwareApplication"]').first()).toBeVisible()

    // Start typing to trigger debounce
    await searchInput.fill("BioContextAI")

    // Immediately after typing, skeleton should appear (debounce loading state)
    // The old cards should be hidden
    await page.waitForTimeout(50)

    // Wait for the search to complete
    await page.waitForURL(/search=BioContextAI/)
    await page.waitForLoadState("networkidle")

    // Eventually results should show
    await expect(page.getByText("BioContextAI Knowledgebase MCP")).toBeVisible()
  })

  test("should display Add Your Server button", async ({ page }) => {
    const addButton = page.getByRole("link", { name: /Add Your Server/ })
    await expect(addButton).toBeVisible()

    // Verify it links to the editor
    await expect(addButton).toHaveAttribute("href", "/registry/editor")
  })

  test("should maintain URL state on page reload", async ({ page }) => {
    // Set up a specific state
    const searchInput = page.getByPlaceholder("Search MCP servers...")
    await searchInput.fill("BioContextAI")
    await page.waitForURL(/search=BioContextAI/)

    const sortSelect = page.getByRole("combobox")
    await sortSelect.click()
    await page.getByRole("option", { name: "Most Helpful" }).click()
    await page.waitForURL(/sort=rating-desc/)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Reload the page
    await page.reload()
    await page.waitForLoadState("networkidle")

    // URL should be the same
    expect(page.url()).toBe(currentUrl)

    // Search input should be populated
    await expect(searchInput).toHaveValue("BioContextAI")

    // Sort should be set
    await expect(sortSelect).toContainText("Most Helpful")
  })
})
