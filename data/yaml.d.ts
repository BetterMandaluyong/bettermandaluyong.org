// Types for `.yaml` imports, handled by vite-plugins/yaml.ts at build time.
declare module "*.yaml" {
  const data: unknown;
  export default data;
}
