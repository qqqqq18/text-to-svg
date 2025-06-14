import { describe, it, expect } from 'vitest'
import TextToSVG from '../src/index'

describe('Multiline Text Support', () => {
  let textToSVG: TextToSVG

  beforeEach(() => {
    textToSVG = TextToSVG.loadSync()
  })

  describe('Basic multiline functionality', () => {
    it('should handle simple two-line text', () => {
      const text = 'Hello\nWorld'
      const svg = textToSVG.getSVG(text, { fontSize: 72 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('<path')
    })

    it('should handle three-line text', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const svg = textToSVG.getSVG(text, { fontSize: 48 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle empty lines', () => {
      const text = 'First\n\nThird'
      const svg = textToSVG.getSVG(text, { fontSize: 36 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Line height option', () => {
    it('should use default line height of 1.2', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72 })
      
      expect(metrics.height).toBeGreaterThan(72) // Should be more than single line
      expect(metrics.height).toBeLessThan(72 * 3) // But not too much (allowing for font metrics)
    })

    it('should respect custom line height', () => {
      const text = 'Line 1\nLine 2'
      const metricsDefault = textToSVG.getMetrics(text, { fontSize: 72 })
      const metricsCustom = textToSVG.getMetrics(text, { fontSize: 72, lineHeight: 2.0 })
      
      expect(metricsCustom.height).toBeGreaterThan(metricsDefault.height)
    })

    it('should handle small line height', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, lineHeight: 0.8 })
      
      expect(metrics.height).toBeGreaterThan(72) // Should still be more than single line
    })
  })

  describe('Text alignment', () => {
    it('should handle left alignment (default)', () => {
      const text = 'Short\nVery long line here'
      const svg = textToSVG.getSVG(text, { fontSize: 48 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle center alignment', () => {
      const text = 'Short\nVery long line here'
      const svg = textToSVG.getSVG(text, { fontSize: 48, textAlign: 'center' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle right alignment', () => {
      const text = 'Short\nVery long line here'
      const svg = textToSVG.getSVG(text, { fontSize: 48, textAlign: 'right' })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Anchor positioning', () => {
    it('should handle top anchor', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, anchor: 'top' })
      
      expect(metrics.y).toBe(0)
    })

    it('should handle middle anchor', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, anchor: 'middle' })
      
      expect(metrics.y).toBeLessThan(0)
    })

    it('should handle bottom anchor', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, anchor: 'bottom' })
      
      expect(metrics.y).toBeLessThan(0)
    })

    it('should handle combined anchor', () => {
      const text = 'Line 1\nLine 2'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72, anchor: 'center middle' })
      
      expect(metrics.x).toBeLessThan(0)
      expect(metrics.y).toBeLessThan(0)
    })
  })

  describe('Path generation', () => {
    it('should generate valid path data for multiline text', () => {
      const text = 'Hello\nWorld'
      const pathData = textToSVG.getD(text, { fontSize: 72 })
      
      expect(pathData).toBeTruthy()
      expect(typeof pathData).toBe('string')
      expect(pathData.length).toBeGreaterThan(0)
    })

    it('should generate path element for multiline text', () => {
      const text = 'Hello\nWorld'
      const pathElement = textToSVG.getPath(text, { fontSize: 72 })
      
      expect(pathElement).toContain('<path')
      expect(pathElement).toContain('d="')
      expect(pathElement).toContain('"/>')
    })
  })

  describe('Attributes and styling', () => {
    it('should apply attributes to multiline text', () => {
      const text = 'Hello\nWorld'
      const svg = textToSVG.getSVG(text, { 
        fontSize: 72, 
        attributes: { fill: 'red', stroke: 'blue' }
      })
      
      expect(svg).toContain('fill="red"')
      expect(svg).toContain('stroke="blue"')
    })
  })

  describe('Envelope transformation with multiline', () => {
    it('should apply arc transformation to multiline text', () => {
      const text = 'Hello\nWorld'
      const svg = textToSVG.getSVG(text, { 
        fontSize: 48,
        envelope: {
          arc: {
            angle: 60
          }
        }
      })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Edge cases', () => {
    it('should handle single character per line', () => {
      const text = 'A\nB\nC'
      const svg = textToSVG.getSVG(text, { fontSize: 72 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle lines with only whitespace', () => {
      const text = 'Hello\n   \nWorld'
      const svg = textToSVG.getSVG(text, { fontSize: 72 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })

    it('should handle many lines', () => {
      const lines = Array(10).fill('Line').map((l, i) => `${l} ${i + 1}`)
      const text = lines.join('\n')
      const svg = textToSVG.getSVG(text, { fontSize: 24 })
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('<path')
    })
  })

  describe('Metrics calculation', () => {
    it('should calculate correct total width for multiline text', () => {
      const text = 'Short\nVery long line here'
      const metrics = textToSVG.getMetrics(text, { fontSize: 48 })
      const longLineMetrics = textToSVG.getMetrics('Very long line here', { fontSize: 48 })
      
      // Total width should be approximately the width of the longest line
      expect(Math.abs(metrics.width - longLineMetrics.width)).toBeLessThan(5)
    })

    it('should calculate correct total height for multiline text', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const singleLineMetrics = textToSVG.getMetrics('Line 1', { fontSize: 48 })
      const multilineMetrics = textToSVG.getMetrics(text, { fontSize: 48, lineHeight: 1.2 })
      
      // Should be approximately 3 lines with line height
      const expectedHeight = singleLineMetrics.height + (2 * 48 * 1.2)
      expect(Math.abs(multilineMetrics.height - expectedHeight)).toBeLessThan(10)
    })

    it('should provide line-specific metrics', () => {
      const text = 'Hello\nWorld'
      const metrics = textToSVG.getMetrics(text, { fontSize: 72 })
      
      expect(metrics).toHaveProperty('lines')
      expect(Array.isArray(metrics.lines)).toBe(true)
      expect(metrics.lines).toHaveLength(2)
      expect(metrics.lines[0]).toHaveProperty('text', 'Hello')
      expect(metrics.lines[1]).toHaveProperty('text', 'World')
    })
  })
})