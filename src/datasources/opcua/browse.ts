import {
  BrowseDirection,
  type ClientSession,
  makeBrowsePath,
  NodeClassMask,
  type NodeIdLike,
  resolveNodeId,
} from "node-opcua";
import type { OpcUaBrowseResult, OpcUaTranslatedPath } from "./types.js";

export async function browseNode(
  session: ClientSession,
  nodeId: NodeIdLike,
): Promise<OpcUaBrowseResult> {
  const result = await session.browse({
    nodeId,
    browseDirection: BrowseDirection.Forward,
    includeSubtypes: true,
    nodeClassMask: NodeClassMask.Object | NodeClassMask.Variable,
    resultMask: 0x3f,
  });

  return {
    nodeId: String(nodeId),
    references: (result.references ?? []).map((reference) => ({
      referenceTypeId: reference.referenceTypeId.toString(),
      browseName: reference.browseName.toString(),
      displayName: reference.displayName.text ?? reference.displayName.toString(),
      nodeId: reference.nodeId.toString(),
      nodeClass: String(reference.nodeClass),
      ...(reference.typeDefinition ? { typeDefinition: reference.typeDefinition.toString() } : {}),
      isForward: reference.isForward,
    })),
  };
}

export async function translateBrowsePath(
  session: ClientSession,
  startingNodeId: string,
  browsePath: string,
): Promise<OpcUaTranslatedPath> {
  const result = await session.translateBrowsePath(
    makeBrowsePath(resolveNodeId(startingNodeId), browsePath),
  );

  return {
    startingNodeId,
    browsePath,
    targets: (result.targets ?? []).map((target) => target.targetId.toString()),
  };
}
