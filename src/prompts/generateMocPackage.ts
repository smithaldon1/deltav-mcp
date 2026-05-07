import { buildEngineeringWorkflowPrompt } from "./helpers.js";
export const generateMocPackagePrompt = buildEngineeringWorkflowPrompt("generate_moc_package", "Generate an offline MOC-oriented engineering package.", ["Include traceability, risk, rollback, training, and commissioning content.", "Do not imply approval for production.", "List unresolved scope and hazard questions."]);
