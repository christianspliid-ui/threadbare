import type { TerrainTextureLabVignetteClickTarget } from '../terrainTextureLabVignettePrototype';

export interface LandmarkClickEntry extends TerrainTextureLabVignetteClickTarget {
  batchKey: string;
  instanceIndex: number;
}

export class VignetteClickRegistry {
  private entries: LandmarkClickEntry[] = [];

  replace(entries: LandmarkClickEntry[]): void {
    this.entries = [...entries];
  }

  list(): readonly LandmarkClickEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}
