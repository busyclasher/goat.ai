import { test, expect } from '@playwright/test';

test.describe('GOAT.ai Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_DEMO_MODE', 'true');
    });
  });

  test('loads homepage and starts conversation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Warren Buffett');
    
    // Check that persona chip is visible
    await expect(page.locator('[data-testid="persona-chip"]')).toBeVisible();
  });

  test('sends message and receives response', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Type a message"]');
    
    // Type a message
    const composer = page.locator('textarea[placeholder*="Type a message"]');
    await composer.fill('@warrenbuffett what do you think about investing?');
    
    // Send the message
    await page.click('button[aria-label="Send message"]');
    
    // Wait for user message to appear
    await expect(page.locator('text=@warrenbuffett what do you think about investing?')).toBeVisible();
    
    // Wait for assistant response (should appear within 8 seconds)
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 8000 });
    
    // Check that audio element is attached
    await expect(page.locator('audio')).toBeVisible();
  });

  test('switches persona with @mention', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Type a message"]');
    
    // Type a message with different persona
    const composer = page.locator('textarea[placeholder*="Type a message"]');
    await composer.fill('@elonmusk tell me about space');
    
    // Send the message
    await page.click('button[aria-label="Send message"]');
    
    // Wait for persona switch (this might take a moment)
    await page.waitForTimeout(2000);
    
    // Check that the persona has switched
    await expect(page.locator('h1')).toContainText('Elon Musk');
  });

  test('handles voice input', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Type a message"]');
    
    // Click the mic button
    await page.click('button[aria-label="Start recording"]');
    
    // Wait for recording state
    await expect(page.locator('button[aria-label="Stop recording"]')).toBeVisible();
    
    // Stop recording
    await page.click('button[aria-label="Stop recording"]');
    
    // In demo mode, this should work without actual audio
    await page.waitForTimeout(1000);
  });

  test('shows error handling', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API Error' })
      });
    });

    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Type a message"]');
    
    // Type a message
    const composer = page.locator('textarea[placeholder*="Type a message"]');
    await composer.fill('test message');
    
    // Send the message
    await page.click('button[aria-label="Send message"]');
    
    // Should show error handling
    await expect(page.locator('text=I\'m sorry, I\'m having trouble processing that right now.')).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Type a message"]');
    
    // Focus the textarea
    const composer = page.locator('textarea[placeholder*="Type a message"]');
    await composer.focus();
    
    // Type with keyboard
    await composer.type('Hello world');
    
    // Press Enter to send
    await composer.press('Enter');
    
    // Wait for message to appear
    await expect(page.locator('text=Hello world')).toBeVisible();
  });
});
