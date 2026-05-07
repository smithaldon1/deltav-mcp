import type { AnyZodObject } from "zod";
import type { ToolHandler, ToolRegister } from "../../src/tools/registerTools.js";

export interface CapturedTool {
  readonly schema: AnyZodObject;
  readonly handler: ToolHandler<AnyZodObject>;
}

export function createToolCapture() {
  const tools = new Map<string, CapturedTool>();
  const register: ToolRegister = (name, _description, schema, handler) => {
    tools.set(name, {
      schema,
      handler: handler as ToolHandler<AnyZodObject>,
    });
  };

  return {
    register,
    get(name: string): CapturedTool {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`Tool ${name} was not registered.`);
      }
      return tool;
    },
  };
}
