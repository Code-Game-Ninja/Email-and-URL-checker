import { test, expect } from '@playwright/test';

test.describe('E2E Testing', () => {
  test('homepage has title and input', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Cybersecurity Risk AI/);

    // Expect the header to be visible
    await expect(page.getByText('Cybersecurity Risk AI').first()).toBeVisible();

    // Expect input to be visible
    await expect(page.getByPlaceholder('Paste a suspicious URL or message text here...')).toBeVisible();
  });

  test('can enter text', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder('Paste a suspicious URL or message text here...');
    await input.fill('http://example.com');
    await expect(input).toHaveValue('http://example.com');
  });

  // Since we don't have real API keys in the environment for the runner usually,
  // or we don't want to hit real APIs, we should mock the API response.
  test('can analyze valid input (mocked API)', async ({ page }) => {
    await page.route('**/api/analyze', async route => {
      const json = {
        overall_risk: 'SAFE',
        url_analysis: {
          summary: 'Safe URL',
          confidence: 'High',
        },
        fraud_text_analysis: {
          fraud_probability: 0.1,
          category: 'safe',
          signals_detected: [],
          extracted_emails: [],
        },
        user_warning_message: 'This content appears safe.',
        disclaimer: 'Disclaimer text',
      };
      await route.fulfill({ json });
    });

    await page.goto('/');

    await page.getByPlaceholder('Paste a suspicious URL or message text here...').fill('http://example.com');
    await page.getByRole('button', { name: 'Analyze Risk' }).click();

    await expect(page.getByText('This content appears safe.')).toBeVisible();
    await expect(page.getByText('SAFE').first()).toBeVisible();
  });

  test('can analyze threat input (mocked API)', async ({ page }) => {
    await page.route('**/api/analyze', async route => {
      const json = {
        overall_risk: 'DANGEROUS',
        url_analysis: {
          summary: 'Malicious URL',
          confidence: 'High',
        },
        fraud_text_analysis: {
          fraud_probability: 0.9,
          category: 'phishing',
          signals_detected: ['urgency', 'fake authority'],
          extracted_emails: [],
        },
        user_warning_message: 'DANGER: This content is dangerous.',
        disclaimer: 'Disclaimer text',
      };
      await route.fulfill({ json });
    });

    await page.goto('/');

    await page.getByPlaceholder('Paste a suspicious URL or message text here...').fill('http://malicious.com');
    await page.getByRole('button', { name: 'Analyze Risk' }).click();

    await expect(page.getByText('DANGER: This content is dangerous.')).toBeVisible();
    await expect(page.getByText('DANGEROUS').first()).toBeVisible();
    await expect(page.getByText('90.0%')).toBeVisible(); // Fraud probability
  });
});
