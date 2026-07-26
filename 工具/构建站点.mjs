import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const 工具目录 = dirname(fileURLToPath(import.meta.url));
const 项目目录 = resolve(工具目录, "..");
const 输出目录 = resolve(项目目录, "dist");
const 静态目录 = resolve(输出目录, "client");
const 服务目录 = resolve(输出目录, "server");

if (dirname(输出目录) !== 项目目录) {
  throw new Error("拒绝清理项目目录之外的构建路径");
}

rmSync(输出目录, { recursive: true, force: true });
mkdirSync(静态目录, { recursive: true });
mkdirSync(服务目录, { recursive: true });

const 运行时资源 = [
  "index.html",
  "common-controls.js",
  "jonasblakewood-nature-519884.mp3",
  "images",
  "chaojuanzhou",
  "fanzhuanlifangti",
  "GEP",
  "riyuelunzhuan",
  "sancengshijianbianhuan",
  "shouye",
  "次页打字机"
];

function 复制路径(来源, 目标) {
  const 状态 = statSync(来源);
  if (状态.isDirectory()) {
    mkdirSync(目标, { recursive: true });
    for (const 名称 of readdirSync(来源)) {
      复制路径(resolve(来源, 名称), resolve(目标, 名称));
    }
    return;
  }
  copyFileSync(来源, 目标);
}

for (const 相对路径 of 运行时资源) {
  const 来源 = resolve(项目目录, 相对路径);
  if (!existsSync(来源)) {
    throw new Error(`构建资源不存在：${相对路径}`);
  }
  复制路径(来源, resolve(静态目录, 相对路径));
}

const 服务入口 = `const worker = {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};

export default worker;
`;

writeFileSync(resolve(服务目录, "index.js"), 服务入口, "utf8");
console.log(`构建完成：${输出目录}`);
