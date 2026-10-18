// THR-1875 (frame plan § E4): the interrupt registry moved into the view-model seam
// (`src/engine/views/interruptRegistry.ts`); this path re-exports it until its last
// importer moves (NFP #6).
export * from '../../engine/views/interruptRegistry';
