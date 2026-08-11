/**
 * Node Registry - migrated to node-manifest.ts
 * This file is kept for backward compatibility
 */
export {
  NODE_MANIFEST_REGISTRY as SYSTEM_NODE_REGISTRY,
  NODE_REQUIREMENTS,
  NODE_CATEGORIES,
  getNodeLabel,
  getNodeColor,
  getNodeOutputSchema,
  getManifestByType,
  getManifestsByCategory,
} from './node-manifest'

export type {
  NodeManifest as SystemNodeCapability,
  NodeRequirement,
  NodeRequirementType,
  NodeIOSchemaField,
  NodeRuntime,
  NodeInputMapping,
} from './node-manifest'
