import path from "node:path";
import type { NextConfig } from "next";

// The rules and prompt live in ../content, outside this app, on purpose.
// These settings make the build include that folder so the deployed app can read it.
const projectRoot = path.join(process.cwd(), "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  outputFileTracingIncludes: {
    "/": ["../content/**/*"],
    "/api/rewrite": ["../content/**/*"],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
