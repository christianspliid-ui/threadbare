/**
 * Seeded 2D Simplex Noise.
 *
 * Ported from Design/coastline-prototype.html.
 * Deterministic: same seed always produces the same noise field.
 */
export class SimplexNoise {
  private p: Uint8Array;

  constructor(seed: number = 0) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;

    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  noise2D(x: number, y: number): number {
    const G2 = (3 - Math.sqrt(3)) / 6;
    const F2 = (Math.sqrt(3) - 1) / 2;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const grad: [number, number][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    const gi0 = this.p[ii + this.p[jj]] % 8;
    const gi1 = this.p[ii + i1 + this.p[jj + j1]] % 8;
    const gi2 = this.p[ii + 1 + this.p[jj + 1]] % 8;
    const dot = (g: [number, number], gx: number, gy: number) => g[0] * gx + g[1] * gy;

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * dot(grad[gi0], x0, y0); }
    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * dot(grad[gi1], x1, y1); }
    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * dot(grad[gi2], x2, y2); }
    return 70 * (n0 + n1 + n2);
  }
}
