/**
 * Copyright (c) 2024 Kazuya Nagata
 * Tests for envelope transformation functionality
 */

import { describe, it, test, expect } from 'vitest'
import TextToSVG from '../src/index.js'
import { EnvelopeTransform } from '../src/envelope-transform.js'

describe('EnvelopeTransform', () => {
  describe('Arc transformation', () => {
    it('should transform path data with positive arc angle', () => {
      const pathData = 'M0,0 L100,0 L100,10 L0,10 Z'
      const options = {
        arc: {
          angle: 30,
          textWidth: 100,
          centerX: 50,
          centerY: 0
        }
      }
      
      const result = EnvelopeTransform.transform(pathData, options)
      
      // Should return valid SVG path data
      expect(result).toBeDefined()
      expect(result).toMatch(/^[M|L|C|Q|Z|H|V|S|T|A].+/)
      expect(result).not.toBe(pathData) // Should be transformed
    })

    it('should transform path data with negative arc angle', () => {
      const pathData = 'M0,0 L100,0 L100,10 L0,10 Z'
      const options = {
        arc: {
          angle: -30,
          textWidth: 100,
          centerX: 50,
          centerY: 0
        }
      }
      
      const result = EnvelopeTransform.transform(pathData, options)
      
      // Should return valid SVG path data
      expect(result).toBeDefined()
      expect(result).toMatch(/^[M|L|C|Q|Z|H|V|S|T|A].+/)
      expect(result).not.toBe(pathData) // Should be transformed
    })
  })
})

describe('TextToSVG with envelope transformation', () => {
  let textToSVG: TextToSVG

  beforeEach(() => {
    textToSVG = TextToSVG.loadSync()
  })

  describe('Arc transformation integration', () => {
    it('should generate arc-transformed SVG with positive angle', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: 45
          }
        }
      }
      
      const result = textToSVG.getSVG('Hello', options)
      
      // Should return valid SVG
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
      expect(result).toContain('<path')
      expect(result).toContain('d="')
    })

    it('should generate arc-transformed SVG with negative angle', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: -45
          }
        }
      }
      
      const result = textToSVG.getSVG('Hello', options)
      
      // Should return valid SVG
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
      expect(result).toContain('<path')
      expect(result).toContain('d="')
    })

    it('should generate different paths for different arc angles', () => {
      const baseOptions = {
        fontSize: 48,
        x: 0,
        y: 0
      }
      
      const upwardArc = textToSVG.getD('Test', {
        ...baseOptions,
        envelope: { arc: { angle: 30 } }
      })
      
      const downwardArc = textToSVG.getD('Test', {
        ...baseOptions,
        envelope: { arc: { angle: -30 } }
      })
      
      const straightText = textToSVG.getD('Test', baseOptions)
      
      // All should be different
      expect(upwardArc).not.toBe(downwardArc)
      expect(upwardArc).not.toBe(straightText)
      expect(downwardArc).not.toBe(straightText)
    })

    it('should work with custom center points', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: 60,
            centerX: 100,
            centerY: 100
          }
        }
      }
      
      const result = textToSVG.getPath('Arc', options)
      
      // Should return valid path element
      expect(result).toContain('<path')
      expect(result).toContain('d="')
      expect(result).toContain('"/>')
    })
  })

  describe('Error handling', () => {
    it('should handle zero angle gracefully', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: 0
          }
        }
      }
      
      const result = textToSVG.getSVG('Test', options)
      
      // Should still generate valid SVG
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
    })

    it('should handle very small angles', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: 0.1
          }
        }
      }
      
      const result = textToSVG.getSVG('Test', options)
      
      // Should still generate valid SVG
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
    })

    it('should handle large angles', () => {
      const options = {
        fontSize: 48,
        envelope: {
          arc: {
            angle: 180
          }
        }
      }
      
      const result = textToSVG.getSVG('Test', options)
      
      // Should still generate valid SVG
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
    })
  })
})