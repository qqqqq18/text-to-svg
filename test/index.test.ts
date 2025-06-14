/**
 * Copyright (c) 2016 Hideki Shiro
 */

import { describe, it, test, expect } from 'vitest'
import TextToSVG from '../src/index.js'
import path from 'path'

// Use the default SourceHan font for testing
const testFontPath = path.join(__dirname, '..', 'fonts', 'SourceHanSerifJP-Light.otf')

function assertAlmostEqual(a: number, b: number, epsilon: number) {
  expect(Math.abs(a - b) < epsilon).toBe(true)
}

class TextToSVGTest {
  private textToSVG: TextToSVG
  private text: string

  constructor(text: string) {
    this.textToSVG = TextToSVG.loadSync()
    this.text = text
  }

  getMetrics(options: any, expected: any) {
    const epsilon = 0.001
    const title = JSON.stringify(options)
    const actual = this.textToSVG.getMetrics(this.text, options)

    it(title, () => {
      assertAlmostEqual(actual.width, expected.width, epsilon)
      assertAlmostEqual(actual.height, expected.height, epsilon)
    })
  }

  getD(options: any, expected: string) {
    const title = JSON.stringify(options)
    const actual = this.textToSVG.getD(this.text, options)

    it(title, () => {
      expect(actual).toBe(expected)
    })
  }

  getPath(options: any, expected: string) {
    const title = JSON.stringify(options)
    const actual = this.textToSVG.getPath(this.text, options)

    it(title, () => {
      expect(actual).toBe(expected)
    })
  }

  getSVG(options: any, expected: string) {
    const title = JSON.stringify(options)
    const actual = this.textToSVG.getSVG(this.text, options)

    it(title, () => {
      expect(actual).toBe(expected)
    })
  }
}

describe('TextToSVG', () => {
  test('basic functionality with default font', () => {
    const textToSVG = TextToSVG.loadSync()
    const result = textToSVG.getD('A')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('basic functionality with explicit font', () => {
    const textToSVG = TextToSVG.loadSync(testFontPath)
    const result = textToSVG.getD('A')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('getSVG with basic options', () => {
    const textToSVG = TextToSVG.loadSync()
    const svg = textToSVG.getSVG('A', { fontSize: 72 })
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('<path')
  })

  test('getMetrics returns correct structure', () => {
    const textToSVG = TextToSVG.loadSync()
    const metrics = textToSVG.getMetrics('A', { fontSize: 72 })
    
    expect(typeof metrics.width).toBe('number')
    expect(typeof metrics.height).toBe('number')
    expect(typeof metrics.x).toBe('number')
    expect(typeof metrics.y).toBe('number')
    expect(typeof metrics.baseline).toBe('number')
    expect(typeof metrics.ascender).toBe('number')
    expect(typeof metrics.descender).toBe('number')
  })
})