import { expect, test } from "@playwright/test"

test("request flow reaches status page", async ({ page }) => {
  const NAV_TIMEOUT_MS = 30_000
  const requestId = "00000000-0000-0000-0000-000000000001"

  // Speed up status page countdown timers so the resend path can be exercised
  // without waiting 10 real minutes.
  await page.addInitScript(() => {
    const originalSetInterval = window.setInterval
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const nextTimeout = typeof timeout === "number" && timeout >= 1000 ? 10 : timeout
      return originalSetInterval(handler, nextTimeout as number, ...(args as []))
    }) as typeof window.setInterval
  })

  await page.route("**/api/request/create", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        requestId,
        sendToken: "test.token",
      }),
    })
  })

  await page.route("**/api/request/send", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        providerCount: 3,
      }),
    })
  })

  await page.route("**/api/request/resend", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        providerCount: 3,
        batchNumber: 2,
      }),
    })
  })

  await page.goto("/request")

  await page.getByRole("button", { name: "Plumber" }).click()
  await expect(page).toHaveURL(/\/request\/time\?service=plumber/, { timeout: NAV_TIMEOUT_MS })

  await page.getByRole("button", { name: "Now" }).click()
  await expect(page).toHaveURL(/\/request\/details\?service=plumber&time=now/, { timeout: NAV_TIMEOUT_MS })

  // In the real flow, lat/lng are typically set via location selection.
  // For e2e reliability, provide stable coordinates in the URL.
  await page.goto(
    "/request/details?service=plumber&time=now&suburb=Ponsonby&lat=-36.8485&lng=174.7633"
  )

  await page.getByPlaceholder("e.g., Ponsonby, Auckland").fill("Ponsonby")
  await page
    .getByPlaceholder("e.g., Blocked drain, leaking tap, new installation")
    .fill("Leaking tap in kitchen")

  await page.getByRole("button", { name: "Send to 3 pros" }).click()
  await expect(page).toHaveURL(/\/request\/verify-phone/, { timeout: NAV_TIMEOUT_MS })

  await page.getByPlaceholder("021 123 4567").fill("0211234567")
  await page.getByRole("button", { name: "Send code" }).click()

  await page.getByPlaceholder("000000").fill("123456")
  await page.getByRole("button", { name: "Verify & Send" }).click()

  await expect(page).toHaveURL(new RegExp(`/request/status/${requestId}`), { timeout: NAV_TIMEOUT_MS })
  await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible()

  // Exercise the resend flow (enabled after the countdown reaches 0).
  const resendButton = page.getByRole("button", { name: /Re-send/ })
  await expect(resendButton).toBeEnabled({ timeout: NAV_TIMEOUT_MS })
  await resendButton.click()
  await expect(page.getByRole("heading", { name: "Sent to 3 more pros" })).toBeVisible()
})
