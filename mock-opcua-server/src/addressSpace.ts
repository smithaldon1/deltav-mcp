import { DataType, Variant, type Namespace, type UAObject } from "node-opcua";

function ensureFolder(namespace: Namespace, parent: UAObject, browseName: string, nodeId: string): UAObject {
  const existing = namespace.addressSpace?.findNode(nodeId);
  if (existing) {
    return existing as UAObject;
  }
  return namespace.addObject({
    organizedBy: parent,
    browseName,
    nodeId,
  });
}

export function addFolderPath(namespace: Namespace, root: UAObject, segments: readonly string[]): UAObject {
  let current = root;
  const pathParts: string[] = [];
  for (const segment of segments) {
    pathParts.push(segment);
    current = ensureFolder(namespace, current, segment, `ns=1;s=${pathParts.join("/")}`);
  }
  return current;
}

export function addDoubleVariable(
  namespace: Namespace,
  parent: UAObject,
  nodeId: string,
  browseName: string,
  getter: () => number,
): void {
  namespace.addVariable({
    componentOf: parent,
    browseName,
    nodeId,
    dataType: "Double",
    minimumSamplingInterval: 250,
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: getter() }),
    },
  });
}

export function addBooleanVariable(
  namespace: Namespace,
  parent: UAObject,
  nodeId: string,
  browseName: string,
  getter: () => boolean,
): void {
  namespace.addVariable({
    componentOf: parent,
    browseName,
    nodeId,
    dataType: "Boolean",
    minimumSamplingInterval: 250,
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: getter() }),
    },
  });
}

export function addStringVariable(
  namespace: Namespace,
  parent: UAObject,
  nodeId: string,
  browseName: string,
  getter: () => string,
): void {
  namespace.addVariable({
    componentOf: parent,
    browseName,
    nodeId,
    dataType: "String",
    minimumSamplingInterval: 250,
    value: {
      get: () => new Variant({ dataType: DataType.String, value: getter() }),
    },
  });
}
