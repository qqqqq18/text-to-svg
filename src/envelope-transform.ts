/**
 * Copyright (c) 2024 Kazuya Nagata
 * Envelope transformation for text-to-svg
 */

import { SVGPathData } from 'svg-pathdata'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ArcTransformOptions {
  /** Arc angle in degrees (positive = upward arc, negative = downward arc) */
  angle: number
  /** Text width for arc calculation */
  textWidth: number
  /** Center point of the arc transformation */
  centerX?: number
  /** Center point of the arc transformation */
  centerY?: number
}

export interface EnvelopeTransformOptions {
  /** Arc transformation options */
  arc?: ArcTransformOptions
}

/**
 * Mathematical utilities for envelope transformations
 */
class MathUtils {
  /**
   * Convert degrees to radians
   */
  static degToRad(deg: number): number {
    return (deg * Math.PI) / 180
  }

  /**
   * Convert radians to degrees
   */
  static radToDeg(rad: number): number {
    return (rad * 180) / Math.PI
  }
}

/**
 * Arc transformation implementation
 * 
 * Algorithm:
 * 1. Calculate arc radius from text width and arc angle
 * 2. Map each point from linear coordinate system to arc coordinate system
 * 3. Apply rotation based on tangent angle at each point
 */
class ArcTransform {
  private options: ArcTransformOptions
  private radius: number
  private angleRad: number

  constructor(options: ArcTransformOptions) {
    this.options = options
    this.angleRad = MathUtils.degToRad(Math.abs(options.angle))
    
    // Handle zero angle case
    if (this.angleRad === 0) {
      this.radius = 0
      return
    }
    
    // Calculate radius: R = textWidth / arcAngle (in radians)
    // For small angles, use arc length approximation
    if (this.angleRad < 0.1) {
      this.radius = options.textWidth / this.angleRad
    } else {
      // For larger angles, use chord-to-radius formula
      this.radius = options.textWidth / (2 * Math.sin(this.angleRad / 2))
    }
  }

  /**
   * Transform a single point from linear to arc coordinates
   */
  transformPoint(x: number, y: number): { x: number, y: number, rotation: number } {
    const { textWidth, centerX = 0, centerY = 0, angle } = this.options
    
    // Handle zero angle case - no transformation
    if (this.angleRad === 0) {
      return {
        x: centerX + x,
        y: centerY + y,
        rotation: 0
      }
    }
    
    // Normalize x position to [-0.5, 0.5] range to center the text on the arc
    const normalizedX = (x / textWidth) - 0.5
    
    // Calculate angle position on arc (centered around 0)
    const pointAngle = normalizedX * this.angleRad
    
    // Calculate arc coordinates
    let arcX: number
    let arcY: number
    
    if (angle > 0) {
      // Upward arc - adjust center position
      arcX = this.radius * Math.sin(pointAngle)
      arcY = this.radius * (Math.cos(pointAngle) - Math.cos(this.angleRad / 2))
    } else {
      // Downward arc - adjust center position  
      arcX = this.radius * Math.sin(pointAngle)
      arcY = -this.radius * (Math.cos(pointAngle) - Math.cos(this.angleRad / 2))
    }
    
    // Apply center offset
    const finalX = centerX + arcX
    const finalY = centerY + arcY + y // Preserve y offset for character height
    
    // Calculate rotation angle (tangent direction)
    const rotation = angle > 0 ? pointAngle : -pointAngle
    
    return {
      x: finalX,
      y: finalY,
      rotation: MathUtils.radToDeg(rotation)
    }
  }
}

/**
 * Calculate bounding box from SVG path data
 */
function calculateBoundingBox(pathData: string): BoundingBox {
  const pathDataObj = new SVGPathData(pathData)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  let currentX = 0
  let currentY = 0
  
  for (const command of pathDataObj.commands) {
    if ('x' in command && 'y' in command && typeof command.x === 'number' && typeof command.y === 'number') {
      currentX = command.x
      currentY = command.y
    } else if ('x' in command && typeof command.x === 'number') {
      currentX = command.x
    } else if ('y' in command && typeof command.y === 'number') {
      currentY = command.y
    }
    
    minX = Math.min(minX, currentX)
    minY = Math.min(minY, currentY)
    maxX = Math.max(maxX, currentX)
    maxY = Math.max(maxY, currentY)
    
    // Also check control points for curves
    if ('x1' in command && 'y1' in command && typeof command.x1 === 'number' && typeof command.y1 === 'number') {
      minX = Math.min(minX, command.x1)
      minY = Math.min(minY, command.y1)
      maxX = Math.max(maxX, command.x1)
      maxY = Math.max(maxY, command.y1)
    }
    
    if ('x2' in command && 'y2' in command && typeof command.x2 === 'number' && typeof command.y2 === 'number') {
      minX = Math.min(minX, command.x2)
      minY = Math.min(minY, command.y2)
      maxX = Math.max(maxX, command.x2)
      maxY = Math.max(maxY, command.y2)
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Main envelope transformation class
 */
export class EnvelopeTransform {
  /**
   * Calculate bounding box from SVG path data
   */
  static calculateBoundingBox(pathData: string): BoundingBox {
    return calculateBoundingBox(pathData)
  }

  /**
   * Apply arc transformation to SVG path data
   */
  static applyArcTransform(pathData: string, options: ArcTransformOptions): string {
    const pathDataObj = new SVGPathData(pathData)
    const arcTransform = new ArcTransform(options)
    
    // Transform all path commands
    const transformedCommands = pathDataObj.commands.map(command => {
      const newCommand = { ...command } as any
      
      // Transform coordinates based on command type
      if ('x' in command && 'y' in command && typeof command.x === 'number' && typeof command.y === 'number') {
        const transformed = arcTransform.transformPoint(command.x, command.y)
        newCommand.x = transformed.x
        newCommand.y = transformed.y
      }
      
      // Handle control points for curves
      if ('x1' in command && 'y1' in command && typeof command.x1 === 'number' && typeof command.y1 === 'number') {
        const transformed = arcTransform.transformPoint(command.x1, command.y1)
        newCommand.x1 = transformed.x
        newCommand.y1 = transformed.y
      }
      
      if ('x2' in command && 'y2' in command && typeof command.x2 === 'number' && typeof command.y2 === 'number') {
        const transformed = arcTransform.transformPoint(command.x2, command.y2)
        newCommand.x2 = transformed.x
        newCommand.y2 = transformed.y
      }
      
      // Handle additional coordinate properties for specific commands
      if ('x' in command && !('y' in command) && typeof command.x === 'number') {
        // Horizontal line command - preserve y coordinate from previous command
        const transformed = arcTransform.transformPoint(command.x, 0)
        newCommand.x = transformed.x
      }
      
      if ('y' in command && !('x' in command) && typeof command.y === 'number') {
        // Vertical line command - preserve x coordinate from previous command  
        const transformed = arcTransform.transformPoint(0, command.y)
        newCommand.y = transformed.y
      }
      
      return newCommand
    })
    
    // Reconstruct path data
    const newPathData = new SVGPathData(transformedCommands)
    return newPathData.encode()
  }

  /**
   * Apply envelope transformation to SVG path data
   */
  static transform(pathData: string, options: EnvelopeTransformOptions): string {
    let result = pathData
    
    // Apply arc transformation if specified
    if (options.arc) {
      result = this.applyArcTransform(result, options.arc)
    }
    
    return result
  }
}