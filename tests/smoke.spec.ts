import { expect, test } from '@playwright/test'

test.describe('cd-demo smoke', () => {
  test('page loads and version banner is populated', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('#sha-display')).not.toHaveText('—')
    await expect(page.locator('#sha-display')).not.toBeEmpty()
    await expect(page.locator('#ts-display')).not.toHaveText('—')
    await expect(page.locator('#ts-display')).not.toBeEmpty()
  })

  test('[Next] advances the step counter', async ({ page }) => {
    await page.goto('/')

    const counter = page.locator('#step-num')
    await expect(counter).toHaveText('1')

    await page.locator('#btn-next').click()
    await expect(counter).toHaveText('2')

    await page.locator('#btn-next').click()
    await expect(counter).toHaveText('3')

    await page.locator('#btn-prev').click()
    await expect(counter).toHaveText('2')
  })

  test('active mermaid node visual changes when stepping', async ({ page }) => {
    await page.goto('/')

    const mermaidContainer = page.locator('#mermaid-container svg')
    if ((await mermaidContainer.count()) === 0) {
      test.skip(true, 'no mermaid graph in this demo (placeholder)')
    }

    await mermaidContainer.first().waitFor({ state: 'attached' })

    const activeShape = page
      .locator('#mermaid-container svg .node')
      .filter({ has: page.locator('rect, polygon, circle') })

    const beforeActive = await activeShape.evaluateAll(nodes =>
      nodes
        .map(n => ({
          id: n.id,
          stroke: (n.querySelector('rect, polygon, circle') as SVGElement | null)?.style.stroke ?? '',
        }))
        .filter(n => n.stroke && n.stroke !== ''),
    )

    await page.locator('#btn-next').click()
    await page.waitForTimeout(200)

    const afterActive = await activeShape.evaluateAll(nodes =>
      nodes
        .map(n => ({
          id: n.id,
          stroke: (n.querySelector('rect, polygon, circle') as SVGElement | null)?.style.stroke ?? '',
        }))
        .filter(n => n.stroke && n.stroke !== ''),
    )

    expect(JSON.stringify(afterActive)).not.toBe(JSON.stringify(beforeActive))
  })
})
