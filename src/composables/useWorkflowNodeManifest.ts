import { computed, shallowRef } from "vue";
import { getWorkflowNodeManifestApi } from "@/api/workflow";

// 在服务端 manifest 尚未加载完成时也先隐藏明确不可用节点，避免
// 节点库先闪现、随后又消失。
export const UNAVAILABLE_WORKFLOW_NODE_TYPES = new Set([
  "douban_book_search",
  "stats_gov_search",
  "hotsearch_tencent_news",
  "reddit_search",
  "producthunt_search",
]);

export interface WorkflowNodeServerManifest {
  type: string;
  name: string;
  category: string;
  description: string;
  inputSchema?: any[];
  outputSchema?: any[];
  executable?: boolean;
  requiredFields?: string[];
  [key: string]: any;
}

const nodes = shallowRef<WorkflowNodeServerManifest[]>([]);
const loading = shallowRef(false);
let loaded = false;
let pending: Promise<WorkflowNodeServerManifest[]> | null = null;

export function useWorkflowNodeManifest() {
  const byType = computed(() => new Map(nodes.value.map((node) => [node.type, node])));

  const load = async (force = false) => {
    if (loaded && !force) return nodes.value;
    if (pending && !force) return pending;
    loading.value = true;
    pending = (async () => {
      try {
        const response: any = await getWorkflowNodeManifestApi();
        const payload = response?.data || response;
        nodes.value = Array.isArray(payload?.nodes) ? payload.nodes : [];
        loaded = nodes.value.length > 0;
        return nodes.value;
      } finally {
        loading.value = false;
        pending = null;
      }
    })();
    return pending;
  };

  return { nodes, byType, loading, load };
}
