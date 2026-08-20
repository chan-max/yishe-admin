import type { Node } from "@vue-flow/core";

export function sanitizeWorkflowVariableKey(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

export function getWorkflowVariableKey(node: Node | any, allNodes: Node[] = []): string {
  const typeBase = sanitizeWorkflowVariableKey(node?.data?.capabilityType || node?.type || "node") || "node";
  const raw = String(node?.data?.variableKey || "").trim();
  const normalizedRaw = sanitizeWorkflowVariableKey(raw);
  const nodeId = sanitizeWorkflowVariableKey(node?.id || "");
  const isRandomNodeKey = normalizedRaw === nodeId && normalizedRaw.startsWith(`${typeBase}_`) && /_[a-z0-9]{6,}$/.test(normalizedRaw);
  if (normalizedRaw && !isRandomNodeKey) return normalizedRaw;
  const base = typeBase;
  const sameType = allNodes.filter(
    (item) => (item.data?.capabilityType || item.type) === (node.data?.capabilityType || node.type),
  );
  const index = Math.max(
    0,
    sameType.findIndex((item) => item.id === node.id),
  );
  return index === 0 ? base : `${base}_${index + 1}`;
}

export function createWorkflowVariableKey(type: string, allNodes: Node[] = []): string {
  const base = sanitizeWorkflowVariableKey(type) || "node";
  const used = new Set(allNodes.map((node) => getWorkflowVariableKey(node, allNodes)));
  let value = base;
  let index = 1;
  while (used.has(value)) value = `${base}_${index++}`;
  return value;
}
