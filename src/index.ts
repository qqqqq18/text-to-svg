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
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
}

interface LineMetrics {
  text: string
  x: number
  y: number
  baseline: number
  width: number
  height: number
  ascender: number
  descender: number
}

interface MultilineMetrics {
  lines: LineMetrics[]
  totalWidth: number
  totalHeight: number
  x: number
  y: number
  lineHeight: number
  baseline: number
}

interface SingleLineMetrics {
  x: number
  y: number
  baseline: number
  width: number
  height: number
  ascender: number
  descender: number
}

interface TextMetrics extends SingleLineMetrics {
  lines?: LineMetrics[]
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

  private getMultilineMetrics(text: string, options: TextToSVGOptions = {}): MultilineMetrics {
    const lines = text.split('\n')
    const fontSize = options.fontSize || 72
    const lineHeight = (options.lineHeight || 1.2) * fontSize
    const textAlign = options.textAlign || 'left'
    const anchor = parseAnchorOption(options.anchor || '')

    // Calculate metrics for each line
    const lineMetrics: SingleLineMetrics[] = lines.map((line: string) => {
      const singleLineOptions = { ...options }
      delete singleLineOptions.lineHeight
      delete singleLineOptions.textAlign
      return this.getMetrics(line, singleLineOptions) as SingleLineMetrics
    })

    // Calculate overall dimensions
    const totalWidth: number = Math.max(...lineMetrics.map((m: SingleLineMetrics) => m.width))
    const totalHeight: number = (lines.length - 1) * lineHeight + lineMetrics[0].height

    // Calculate positioning
    let x = options.x || 0
    let y = options.y || 0

    // Apply horizontal anchor to overall text block
    switch (anchor.horizontal) {
      case 'left':
        x -= 0
        break
      case 'center':
        x -= totalWidth / 2
        break
      case 'right':
        x -= totalWidth
        break
      default:
        throw new Error(`Unknown anchor option: ${anchor.horizontal}`)
    }

    // Apply vertical anchor to overall text block
    switch (anchor.vertical) {
      case 'baseline':
        y -= lineMetrics[0].ascender
        break
      case 'top':
        y -= 0
        break
      case 'middle':
        y -= totalHeight / 2
        break
      case 'bottom':
        y -= totalHeight
        break
      default:
        throw new Error(`Unknown anchor option: ${anchor.vertical}`)
    }

    // Calculate position for each line
    const linesWithPositions: LineMetrics[] = lines.map((line: string, index: number): LineMetrics => {
      const lineMetric: SingleLineMetrics = lineMetrics[index]
      let lineX = x

      // Apply text alignment to each line
      switch (textAlign) {
        case 'left':
          lineX += 0
          break
        case 'center':
          lineX += (totalWidth - lineMetric.width) / 2
          break
        case 'right':
          lineX += totalWidth - lineMetric.width
          break
      }

      const lineY = y + index * lineHeight

      return {
        text: line,
        x: lineX,
        y: lineY,
        baseline: lineY + lineMetric.ascender,
        width: lineMetric.width,
        height: lineMetric.height,
        ascender: lineMetric.ascender,
        descender: lineMetric.descender
      }
    })

    return {
      lines: linesWithPositions,
      totalWidth,
      totalHeight,
      x,
      y,
      lineHeight,
      baseline: y + lineMetrics[0].ascender
    }
  }

  getMetrics(text: string, options: TextToSVGOptions = {}): TextMetrics {
    // Handle multiline text
    if (text.includes('\n')) {
      const multilineMetrics: MultilineMetrics = this.getMultilineMetrics(text, options)
      return {
        x: multilineMetrics.x,
        y: multilineMetrics.y,
        baseline: multilineMetrics.baseline,
        width: multilineMetrics.totalWidth,
        height: multilineMetrics.totalHeight,
        ascender: multilineMetrics.lines[0].ascender,
        descender: multilineMetrics.lines[multilineMetrics.lines.length - 1].descender,
        lines: multilineMetrics.lines
      }
    }

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

  private getMultilineD(text: string, options: TextToSVGOptions = {}) {
    const multilineMetrics = this.getMultilineMetrics(text, options)
    const fontSize = options.fontSize || 72
    const kerning = 'kerning' in options ? options.kerning : true
    const letterSpacing = 'letterSpacing' in options ? options.letterSpacing : undefined
    const tracking = 'tracking' in options ? options.tracking : undefined

    // Calculate the overall center point for arc transformations
    const overallCenterX = multilineMetrics.x + multilineMetrics.totalWidth / 2
    const overallCenterY = multilineMetrics.baseline

    let combinedPathData = ''

    for (const lineData of multilineMetrics.lines) {
      if (lineData.text.trim() === '') {
        // Skip empty lines
        continue
      }

      const path = this.font.getPath(
        lineData.text,
        lineData.x,
        lineData.baseline,
        fontSize,
        { kerning, letterSpacing, tracking }
      )
      
      let linePathData = path.toPathData()
      
      // Apply envelope transformation to each line if specified
      if (options.envelope) {
        if (options.envelope.arc) {
          const envelopeOptions = { ...options.envelope }
          envelopeOptions.arc = { ...options.envelope.arc }
          
          // For multiline text, use consistent arc curvature based on text alignment
          if (!envelopeOptions.arc.centerY) {
            envelopeOptions.arc.centerY = overallCenterY
          }
          
          // Use the maximum width (totalWidth) for consistent arc curvature across all lines
          envelopeOptions.arc.textWidth = multilineMetrics.totalWidth
          
          // Calculate arc center based on text alignment mode
          const textAlign = options.textAlign || 'left'
          
          if (textAlign === 'center') {
            // Center alignment: adjust center point based on line position relative to overall center
            if (!envelopeOptions.arc.centerX) {
              envelopeOptions.arc.centerX = overallCenterX
            }
            const lineCenterX = lineData.x + lineData.width / 2
            const offsetFromOverallCenter = lineCenterX - overallCenterX
            envelopeOptions.arc.centerX = overallCenterX - offsetFromOverallCenter
            
          } else if (textAlign === 'left') {
            // Left alignment: use left edge of overall text block as arc reference
            const overallLeftX = multilineMetrics.x
            if (!envelopeOptions.arc.centerX) {
              envelopeOptions.arc.centerX = overallLeftX + multilineMetrics.totalWidth / 2
            }
            // Calculate offset from line start to overall start
            const lineStartX = lineData.x
            const offsetFromOverallLeft = lineStartX - overallLeftX
            envelopeOptions.arc.centerX = overallLeftX + multilineMetrics.totalWidth / 2 - offsetFromOverallLeft
            
          } else if (textAlign === 'right') {
            // Right alignment: use right edge of overall text block as arc reference
            const overallRightX = multilineMetrics.x + multilineMetrics.totalWidth
            if (!envelopeOptions.arc.centerX) {
              envelopeOptions.arc.centerX = overallRightX - multilineMetrics.totalWidth / 2
            }
            // Calculate offset from line end to overall end
            const lineEndX = lineData.x + lineData.width
            const offsetFromOverallRight = overallRightX - lineEndX
            envelopeOptions.arc.centerX = overallRightX - multilineMetrics.totalWidth / 2 + offsetFromOverallRight
            
          } else {
            // Default fallback (treat as left alignment)
            const overallLeftX = multilineMetrics.x
            if (!envelopeOptions.arc.centerX) {
              envelopeOptions.arc.centerX = overallLeftX + multilineMetrics.totalWidth / 2
            }
            const lineStartX = lineData.x
            const offsetFromOverallLeft = lineStartX - overallLeftX
            envelopeOptions.arc.centerX = overallLeftX + multilineMetrics.totalWidth / 2 - offsetFromOverallLeft
          }
          
          linePathData = EnvelopeTransform.transform(linePathData, envelopeOptions)
        } else {
          linePathData = EnvelopeTransform.transform(linePathData, options.envelope)
        }
      }
      
      combinedPathData += linePathData
    }

    return combinedPathData
  }

  getD(text: string, options: TextToSVGOptions = {}) {
    // Handle multiline text
    if (text.includes('\n')) {
      return this.getMultilineD(text, options)
    }

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
    
    // Handle multiline text
    if (text.includes('\n')) {
      return this.getMultilineSVG(text, options)
    }
    
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

  private getMultilineSVG(text: string, options: TextToSVGOptions = {}) {
    // Get the multiline path data
    const pathData = this.getMultilineD(text, options)
    
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
      // For non-transformed multiline paths, use metrics-based calculation
      const metrics = this.getMetrics(text, options)
      box = {
        width: Math.max(metrics.x + metrics.width, 0) - Math.min(metrics.x, 0),
        height: Math.max(metrics.y + metrics.height, 0) - Math.min(metrics.y, 0),
      }
      const origin = {
        x: box.width - Math.max(metrics.x + metrics.width, 0),
        y: box.height - Math.max(metrics.y + metrics.height, 0),
      }

      // For multiline without envelope, we need to adjust the coordinates
      // Apply translation to the path data
      finalPathData = svgpath(pathData)
        .translate(origin.x, origin.y)
        .toString()
    }

    // Build SVG with path data
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
