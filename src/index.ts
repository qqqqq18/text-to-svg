/**
 * Copyright (c) 2016 Hideki Shiro
 */

const opentype = require('opentype.js')
const svgpath = require('svgpath')
import { EnvelopeTransform, EnvelopeTransformOptions, BoundingBox } from './envelope-transform'

export interface TextToSVGOptions {
  fontSize?: number
  letterSpacing?: number
  tracking?: number
  kerning?: boolean
  anchor?: string
  x?: number
  y?: number
  attributes?: {[x: string]: any}
  envelope?: EnvelopeTransformOptions
}

// Private method

function parseAnchorOption(anchor: string) {
  const matchH = anchor.match(/left|center|right/gi) || []
  const horizontal = matchH.length === 0 ? 'left' : matchH[0]

  const matchV = anchor.match(/baseline|top|bottom|middle/gi) || []
  const vertical = matchV.length === 0 ? 'baseline' : matchV[0]

  return { horizontal, vertical }
}

export default class TextToSVG {
  constructor(private font: any) {}

  static loadSync(file?: string) {
    const path = require('path')
    const defaultFont = file || path.join(__dirname, '..', 'fonts', 'SourceHanSerifJP-Light.otf')
    return new TextToSVG(opentype.loadSync(defaultFont))
  }

  static load(url: string) {
    return new Promise<TextToSVG>((resolve, reject) => {
      opentype.load(url, (err: any, font: any) => {
        if (err) {
          return reject(err)
        }
        if (!font) {
          return reject("Font not found")
        }
        return resolve(new TextToSVG(font))
      })
    })
  }

  static parse(arrayBuffer: ArrayBuffer) {
    return new TextToSVG(opentype.parse(arrayBuffer))
  }

  getFont() {
    return this.font
  }
  getWidth(text: string, options: TextToSVGOptions) {
    const fontSize = options.fontSize || 72
    const kerning = 'kerning' in options ? options.kerning : true
    const fontScale = (1 / this.font.unitsPerEm) * fontSize

    let width = 0
    const glyphs = this.font.stringToGlyphs(text)
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i]

      if (glyph.advanceWidth) {
        width += glyph.advanceWidth * fontScale
      }

      if (kerning && i < glyphs.length - 1) {
        const kerningValue = this.font.getKerningValue(glyph, glyphs[i + 1])
        width += kerningValue * fontScale
      }

      if (options.letterSpacing) {
        width += options.letterSpacing * fontSize
      } else if (options.tracking) {
        width += (options.tracking / 1000) * fontSize
      }
    }
    return width
  }

  getHeight(fontSize: number) {
    const fontScale = (1 / this.font.unitsPerEm) * fontSize
    return (this.font.ascender - this.font.descender) * fontScale
  }

  getMetrics(text: string, options: TextToSVGOptions = {}) {
    const fontSize = options.fontSize || 72
    const anchor = parseAnchorOption(options.anchor || '')

    const width = this.getWidth(text, options)
    const height = this.getHeight(fontSize)

    const fontScale = (1 / this.font.unitsPerEm) * fontSize
    const ascender = this.font.ascender * fontScale
    const descender = this.font.descender * fontScale

    let x = options.x || 0
    switch (anchor.horizontal) {
      case 'left':
        x -= 0
        break
      case 'center':
        x -= width / 2
        break
      case 'right':
        x -= width
        break
      default:
        throw new Error(`Unknown anchor option: ${anchor.horizontal}`)
    }

    let y = options.y || 0
    switch (anchor.vertical) {
      case 'baseline':
        y -= ascender
        break
      case 'top':
        y -= 0
        break
      case 'middle':
        y -= height / 2
        break
      case 'bottom':
        y -= height
        break
      default:
        throw new Error(`Unknown anchor option: ${anchor.vertical}`)
    }

    const baseline = y + ascender

    return {
      x,
      y,
      baseline,
      width,
      height,
      ascender,
      descender,
    }
  }

  getD(text: string, options: TextToSVGOptions = {}) {
    const fontSize = options.fontSize || 72
    const kerning = 'kerning' in options ? options.kerning : true
    const letterSpacing =
      'letterSpacing' in options ? options.letterSpacing : undefined
    const tracking = 'tracking' in options ? options.tracking : undefined
    const metrics = this.getMetrics(text, options)
    const path = this.font.getPath(
      text,
      metrics.x,
      metrics.baseline,
      fontSize,
      { kerning, letterSpacing, tracking }
    )
    let pathData = path.toPathData()
    
    // Apply envelope transformation if specified
    if (options.envelope) {
      // Set text width for arc transformation
      if (options.envelope.arc) {
        options.envelope.arc.textWidth = metrics.width
        if (!options.envelope.arc.centerX) {
          options.envelope.arc.centerX = metrics.x + metrics.width / 2
        }
        if (!options.envelope.arc.centerY) {
          options.envelope.arc.centerY = metrics.baseline
        }
      }
      pathData = EnvelopeTransform.transform(pathData, options.envelope)
    }
    
    return pathData
  }

  getPath(text: string, options: TextToSVGOptions = {}) {
    const attributes = options.attributes || {}
    const attributesStr = Object.keys(attributes)
      .map((key) => `${key}="${attributes[key]}"`)
      .join(' ')
    const d = this.getD(text, options)

    if (attributesStr) {
      return `<path ${attributesStr} d="${d}"/>`
    }

    return `<path d="${d}"/>`
  }

  getSVG(text: string, options: TextToSVGOptions = {}) {
    options = JSON.parse(JSON.stringify(options))

    options.x = options.x || 0
    options.y = options.y || 0
    
    // Get the path data first to calculate accurate bounding box
    const pathData = this.getD(text, options)
    
    let box: { width: number; height: number }
    let finalPathData: string
    
    if (options.envelope) {
      // For transformed paths, calculate bounding box from actual path data
      const boundingBox = EnvelopeTransform.calculateBoundingBox(pathData)
      
      // Add some padding for better visual appearance
      const padding = 10
      box = {
        width: boundingBox.width + padding * 2,
        height: boundingBox.height + padding * 2
      }
      
      // Calculate the translation needed to center the content in the viewBox
      const translateX = (box.width - boundingBox.width) / 2 - boundingBox.x
      const translateY = (box.height - boundingBox.height) / 2 - boundingBox.y
      
      // Apply translation directly to path data using svgpath library
      finalPathData = svgpath(pathData)
        .translate(translateX, translateY)
        .toString()
    } else {
      // For non-transformed paths, use original metrics-based calculation
      const metrics = this.getMetrics(text, options)
      box = {
        width: Math.max(metrics.x + metrics.width, 0) - Math.min(metrics.x, 0),
        height: Math.max(metrics.y + metrics.height, 0) - Math.min(metrics.y, 0),
      }
      const origin = {
        x: box.width - Math.max(metrics.x + metrics.width, 0),
        y: box.height - Math.max(metrics.y + metrics.height, 0),
      }

      // Shift text based on origin for non-envelope case
      options.x += origin.x
      options.y += origin.y
      
      // Use the standard path generation
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.width} ${box.height}">${this.getPath(text, options)}</svg>`
    }

    // Build SVG with transformed path data
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.width} ${box.height}">`
    
    // Add attributes to the path if specified
    if (options.attributes) {
      const attributesStr = Object.keys(options.attributes)
        .map((key) => `${key}="${options.attributes![key]}"`)
        .join(' ')
      svg += `<path ${attributesStr} d="${finalPathData}"/>`
    } else {
      svg += `<path d="${finalPathData}"/>`
    }
    
    svg += '</svg>'

    return svg
  }

  getDebugSVG(text: string, options: TextToSVGOptions = {}) {
    options = JSON.parse(JSON.stringify(options))

    options.x = options.x || 0
    options.y = options.y || 0
    const metrics = this.getMetrics(text, options)
    const box = {
      width: Math.max(metrics.x + metrics.width, 0) - Math.min(metrics.x, 0),
      height: Math.max(metrics.y + metrics.height, 0) - Math.min(metrics.y, 0),
    }
    const origin = {
      x: box.width - Math.max(metrics.x + metrics.width, 0),
      y: box.height - Math.max(metrics.y + metrics.height, 0),
    }

    // Shift text based on origin
    options.x += origin.x
    options.y += origin.y

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${box.width}" height="${box.height}">`
    svg += `<path fill="none" stroke="red" stroke-width="1" d="M0,${origin.y}L${box.width},${origin.y}"/>` // X Axis
    svg += `<path fill="none" stroke="red" stroke-width="1" d="M${origin.x},0L${origin.x},${box.height}"/>` // Y Axis
    svg += this.getPath(text, options)
    svg += '</svg>'

    return svg
  }
}
