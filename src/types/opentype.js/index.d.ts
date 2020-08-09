import { Path, RenderOptions } from 'opentype.js'

declare module "opentype.js" {
  interface RenderOptions {
    script?: string;
    language?: string;
    kerning?: boolean;
    xScale?: number;
    yScale?: number;
    letterSpacing?: number;
    tracking?: number;
    features?: {
        [key: string]: boolean;
    };
}
  interface Path {
    toPathData(decimalPlaces?: number): string
  }
}
