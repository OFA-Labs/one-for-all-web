/**
 * Architecture rules for src/. Run with `npm run check:arch`.
 *
 * - features are isolated: a feature never imports another feature
 * - shared layers (components, hooks, lib, config) never import from features
 * - no circular dependencies, no orphan modules (Next.js entry files excepted)
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature-imports",
      severity: "error",
      comment:
        "Features must not import each other. Move shared code to components/, lib/ or config/.",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/", pathNot: "^src/features/$1/" },
    },
    {
      name: "shared-must-not-import-features",
      severity: "error",
      comment:
        "Shared layers must stay feature-agnostic so any feature can use them.",
      from: { path: "^src/(components|hooks|lib|config)/" },
      to: { path: "^src/features/" },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make load order and refactors fragile.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment:
        "Modules nothing imports are dead code. Next.js entry files are reached by the router, not by imports.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "^src/app/(page|layout|template|error|global-error|loading|not-found|default|route)\\.tsx?$",
          "^src/app/.*/(page|layout|template|error|global-error|loading|not-found|default|route)\\.tsx?$",
        ],
      },
      to: {},
    },
  ],
  options: {
    includeOnly: "^src/",
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json"],
    },
  },
};
