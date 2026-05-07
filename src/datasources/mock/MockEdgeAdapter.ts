import { EdgeRestAdapter } from "../edge/EdgeRestAdapter.js";

export class MockEdgeAdapter extends EdgeRestAdapter {
  override readonly kind = "MOCK_EDGE_REST" as const;
}
