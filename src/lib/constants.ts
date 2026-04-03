export const PREDEFINED_REPOS = [
  "vercel/next.js",
  "facebook/react",
  "tailwindlabs/tailwindcss",
  "shadcn-ui/ui",
  "microsoft/vscode",
  "framer/motion",
  "sushanthj674/todo-wrk-flw",
  "sushanthj674/git-hub-actions",
  "nodejs/node",
  "denoland/deno",
  "bun-sh/bun",
  "rust-lang/rust",
  "python/cpython",
  "golang/go",
  "kubernetes/kubernetes",
  "docker/cli",
  "ant-design/ant-design",
  "mui/material-ui",
  "remix-run/remix",
  "solidjs/solid",
  "vuejs/core"
];

export const PREDEFINED_OWNERS = Array.from(new Set(PREDEFINED_REPOS.map(repo => repo.split('/')[0]))).sort();
