import * as THREE from 'three';

export interface LandmarkValidationReport {
  type: 'vignette.landmark.validation';
  modelUrl: string;
  declaredMaterialCount: number;
  truncatedToMaterialCount: number;
  severity: 'warn' | 'info';
}

export function validateLandmarkExport(
  scene: THREE.Group,
  modelUrl: string,
  maxMaterialSlots: number,
): LandmarkValidationReport {
  let submeshCount = 0;
  scene.traverse(child => {
    if (child instanceof THREE.Mesh) submeshCount++;
  });

  const truncatedToMaterialCount = Math.min(submeshCount, maxMaterialSlots);
  const severity: 'warn' | 'info' = submeshCount > maxMaterialSlots ? 'warn' : 'info';

  return {
    type: 'vignette.landmark.validation',
    modelUrl,
    declaredMaterialCount: submeshCount,
    truncatedToMaterialCount,
    severity,
  };
}
