declare module "eslint-plugin-import" {
  import { Linter } from "eslint";

  const plugin: {
    rules: Record<string, Linter.RuleEntry>;
    configs?: Record<string, Linter.Config>;
  };

  export = plugin;
}
