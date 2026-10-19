/**
 * The delta cluster's one tunable (THR-1895: moved out of `DeltaCluster.tsx` so the
 * aftermath builder in `src/engine/views/stage/` can share it without importing a
 * component). `DeltaCluster` re-exports it.
 */

/** Most marks a cluster draws — past three, a row stops being countable at a glance. */
export const DELTA_CLUSTER_MAX = 3;
