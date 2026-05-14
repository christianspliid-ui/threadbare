import type * as THREE from 'three';

export class VignetteContextLossHandler {
  private canvas: HTMLCanvasElement;
  private onLoss: () => void;
  private onRestore: () => void;
  private loseContextExt: WEBGL_lose_context | null;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: THREE.WebGLRenderer,
    onLoss: () => void,
    onRestore: () => void,
  ) {
    this.canvas = canvas;
    this.onLoss = onLoss;
    this.onRestore = onRestore;

    const gl = renderer.getContext() as WebGLRenderingContext | WebGL2RenderingContext;
    this.loseContextExt = gl.getExtension('WEBGL_lose_context');

    canvas.addEventListener('webglcontextlost', this.handleLost);
    canvas.addEventListener('webglcontextrestored', this.handleRestored);
  }

  private handleLost = (event: Event) => {
    event.preventDefault();
    if (import.meta.env.DEV) console.debug('[vignette.context]', 'lost');
    this.onLoss();
  };

  private handleRestored = () => {
    if (import.meta.env.DEV) console.debug('[vignette.context]', 'restored — rebuilding');
    this.onRestore();
  };

  // Returns false when WEBGL_lose_context is unavailable (e.g. some mobile drivers).
  forceLoss(): boolean {
    if (!this.loseContextExt) {
      console.warn('[VignetteContextLossHandler] WEBGL_lose_context extension not available');
      return false;
    }
    this.loseContextExt.loseContext();
    return true;
  }

  dispose(): void {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleRestored);
  }
}
