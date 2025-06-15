import { describe, it, expect, beforeEach } from 'vitest'
import TextToSVG from '../src/index'

describe('Vertical Writing Support', () => {
  let textToSVG: TextToSVG

  beforeEach(() => {
    textToSVG = TextToSVG.loadSync()
  })

  describe('Basic vertical writing functionality', () => {
    it('should handle simple vertical text', () => {
      const text = 'こんにちは'
      const svg = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('<path')
    })

    it('should handle English text in vertical mode', () => {
      const text = 'Hello'
      const svg = textToSVG.getSVG(text, { fontSize: 48, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle single character', () => {
      const text = 'あ'
      const svg = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Vertical multiline functionality', () => {
    it('should handle two-line vertical text', () => {
      const text = 'こんにちは\n世界'
      const svg = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('<path')
    })

    it('should handle three-line vertical text', () => {
      const text = '第一行\n第二行\n第三行'
      const svg = textToSVG.getSVG(text, { fontSize: 48, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle empty lines in vertical text', () => {
      const text = '最初\n\n最後'
      const svg = textToSVG.getSVG(text, { fontSize: 36, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Vertical writing metrics', () => {
    it('should calculate correct metrics for single line vertical text', () => {
      const text = 'こんにちは'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(metrics.width).toBeGreaterThan(0)
      expect(metrics.height).toBeGreaterThan(0)
      expect(typeof metrics.x).toBe('number')
      expect(typeof metrics.y).toBe('number')
    })

    it('should calculate correct metrics for multiline vertical text', () => {
      const text = 'こんにちは\n世界'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(metrics.width).toBeGreaterThan(0)
      expect(metrics.height).toBeGreaterThan(0)
      expect(metrics).toHaveProperty('lines')
      expect(Array.isArray(metrics.lines)).toBe(true)
      expect(metrics.lines).toHaveLength(2)
    })

    it('should have different dimensions than horizontal text', () => {
      const text = 'こんにちは'
      const horizontalMetrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'horizontal' })
      const verticalMetrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical' })
      
      // In vertical writing, width and height should be swapped compared to horizontal
      expect(verticalMetrics.width).toBeLessThan(horizontalMetrics.width)
      expect(verticalMetrics.height).toBeGreaterThan(horizontalMetrics.height)
    })
  })

  describe('Anchor positioning in vertical mode', () => {
    it('should handle top anchor in vertical mode', () => {
      const text = 'こんにちは'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical', anchor: 'top' })
      
      // In vertical mode, top anchor means text starts from y coordinate (y=0 at origin)
      expect(metrics.y).toBe(0)
    })

    it('should handle center anchor in vertical mode', () => {
      const text = 'こんにちは'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical', anchor: 'center' })
      
      expect(metrics.x).toBeLessThan(0)
    })

    it('should handle combined anchor in vertical mode', () => {
      const text = 'こんにちは'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical', anchor: 'center middle' })
      
      expect(metrics.x).toBeLessThan(0)
      expect(metrics.y).toBeLessThan(0)
    })
  })

  describe('Path generation for vertical writing', () => {
    it('should generate valid path data for vertical text', () => {
      const text = 'こんにちは'
      const pathData = textToSVG.getD(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(pathData).toBeTruthy()
      expect(typeof pathData).toBe('string')
      expect(pathData.length).toBeGreaterThan(0)
    })

    it('should generate path element for vertical text', () => {
      const text = 'こんにちは'
      const pathElement = textToSVG.getPath(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(pathElement).toContain('<path')
      expect(pathElement).toContain('d="')
      expect(pathElement).toContain('"/>')
    })

    it('should generate valid path data for multiline vertical text', () => {
      const text = 'こんにちは\n世界'
      const pathData = textToSVG.getD(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(pathData).toBeTruthy()
      expect(typeof pathData).toBe('string')
      expect(pathData.length).toBeGreaterThan(0)
    })
  })

  describe('Attributes and styling in vertical mode', () => {
    it('should apply attributes to vertical text', () => {
      const text = 'こんにちは'
      const svg = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical',
        attributes: { fill: 'red', stroke: 'blue' }
      })
      
      expect(svg).toContain('fill="red"')
      expect(svg).toContain('stroke="blue"')
    })

    it('should apply attributes to multiline vertical text', () => {
      const text = 'こんにちは\n世界'
      const svg = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical',
        attributes: { fill: 'green', 'stroke-width': '2' }
      })
      
      expect(svg).toContain('fill="green"')
      expect(svg).toContain('stroke-width="2"')
    })
  })

  describe('Envelope and textAlign restrictions', () => {
    it('should ignore envelope transformation in vertical mode', () => {
      const text = 'こんにちは'
      const svgWithoutEnvelope = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical'
      })
      const svgWithEnvelope = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical',
        envelope: {
          arc: { angle: 60 }
        }
      })
      
      // In vertical mode, envelope should be ignored, so SVGs should be similar
      expect(svgWithoutEnvelope.length).toBeCloseTo(svgWithEnvelope.length, -2)
    })

    it('should ignore textAlign in vertical mode for multiline text', () => {
      const text = 'こんにちは\n世界'
      const svgLeft = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical',
        textAlign: 'left'
      })
      const svgCenter = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'vertical',
        textAlign: 'center'
      })
      
      // In vertical mode, textAlign should be ignored, so SVGs should be similar
      expect(svgLeft.length).toBeCloseTo(svgCenter.length, -2)
    })
  })

  describe('Line height in vertical mode', () => {
    it('should respect custom line height in vertical mode', () => {
      const text = 'こんにちは\n世界'
      const metricsDefault = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical' })
      const metricsCustom = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical', lineHeight: 2.0 })
      
      // With larger lineHeight, total width should be larger (lines are spaced further apart horizontally)
      expect(metricsCustom.width).toBeGreaterThan(metricsDefault.width)
    })

    it('should handle small line height in vertical mode', () => {
      const text = 'こんにちは\n世界'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, writingMode: 'vertical', lineHeight: 0.8 })
      
      expect(metrics.width).toBeGreaterThan(0)
      expect(metrics.height).toBeGreaterThan(0)
    })
  })

  describe('Edge cases in vertical mode', () => {
    it('should handle single character per line in vertical mode', () => {
      const text = 'あ\nい\nう'
      const svg = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle lines with only whitespace in vertical mode', () => {
      const text = 'こんにちは\n   \n世界'
      const svg = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle many lines in vertical mode', () => {
      const lines = Array(5).fill('行').map((l, i) => `${l}${i + 1}`)
      const text = lines.join('\n')
      const svg = textToSVG.getSVG(text, { fontSize: 24, writingMode: 'vertical' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Default behavior preservation', () => {
    it('should default to horizontal writing when writingMode is not specified', () => {
      const text = 'Hello World'
      const svgDefault = textToSVG.getSVG(text, { fontSize: 72 })
      const svgHorizontal = textToSVG.getSVG(text, { fontSize: 72, writingMode: 'horizontal' })
      
      expect(svgDefault).toBe(svgHorizontal)
    })

    it('should preserve all horizontal features when writingMode is horizontal', () => {
      const text = 'Hello\nWorld'
      const svg = textToSVG.getSVG(text, { 
        fontSize: 72, 
        writingMode: 'horizontal',
        textAlign: 'center',
        envelope: { arc: { angle: 30 } }
      })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })
})