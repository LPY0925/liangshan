import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Script } from "node:vm";

const 工具目录 = dirname(fileURLToPath(import.meta.url));
const 项目目录 = resolve(工具目录, "..");
const 忽略目录 = new Set([".git", ".netlify", "node_modules"]);
const 网页文件 = [];
const 样式文件 = [];
const 错误 = [];

function 遍历目录(目录) {
  for (const 名称 of readdirSync(目录)) {
    if (
      忽略目录.has(名称) ||
      (目录 === 项目目录 && 名称 === "dist")
    ) {
      continue;
    }
    const 路径 = resolve(目录, 名称);
    const 状态 = statSync(路径);
    if (状态.isDirectory()) {
      遍历目录(路径);
    } else if (extname(名称).toLowerCase() === ".html") {
      网页文件.push(路径);
    } else if (extname(名称).toLowerCase() === ".css") {
      样式文件.push(路径);
    }
  }
}

function 记录错误(文件, 信息) {
  错误.push(`${文件.slice(项目目录.length + 1)}：${信息}`);
}

function 提取编号集合(内容) {
  const 编号 = new Set();
  const 重复 = new Set();
  for (const 匹配 of 内容.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) {
    if (编号.has(匹配[2])) 重复.add(匹配[2]);
    编号.add(匹配[2]);
  }
  return { 编号, 重复 };
}

function 是外部地址(地址) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(地址);
}

function 解析本地地址(来源文件, 地址) {
  const 纯地址 = 地址.trim();
  if (!纯地址 || 纯地址 === "#" || 是外部地址(纯地址)) return null;
  const 目标网址 = new URL(纯地址, pathToFileURL(来源文件));
  if (目标网址.protocol !== "file:") return null;
  const 片段 = decodeURIComponent(目标网址.hash.replace(/^#/, ""));
  目标网址.hash = "";
  目标网址.search = "";
  let 目标路径 = fileURLToPath(目标网址);
  if (existsSync(目标路径) && statSync(目标路径).isDirectory()) {
    目标路径 = resolve(目标路径, "index.html");
  }
  return { 目标路径, 片段 };
}

遍历目录(项目目录);

const 网页编号缓存 = new Map();
for (const 文件 of 网页文件) {
  const 内容 = readFileSync(文件, "utf8");
  const { 编号, 重复 } = 提取编号集合(内容);
  网页编号缓存.set(文件, 编号);
  for (const 值 of 重复) 记录错误(文件, `存在重复 id「${值}」`);

  for (const 匹配 of 内容.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const 属性 = 匹配[1];
    if (/\bsrc\s*=/i.test(属性)) continue;
    const 类型匹配 = 属性.match(/\btype\s*=\s*(["'])(.*?)\1/i);
    if (
      类型匹配 &&
      !/^(?:text|application)\/javascript$/i.test(类型匹配[2]) &&
      类型匹配[2].toLowerCase() !== "module"
    ) {
      continue;
    }
    try {
      new Script(匹配[2], { filename: 文件 });
    } catch (原因) {
      记录错误(文件, `内联脚本语法错误：${原因.message}`);
    }
  }
}

for (const 文件 of 网页文件) {
  const 内容 = readFileSync(文件, "utf8");
  const 属性表达式 = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;

  for (const 匹配 of 内容.matchAll(属性表达式)) {
    const 结果 = 解析本地地址(文件, 匹配[2]);
    if (!结果) continue;
    const { 目标路径, 片段 } = 结果;

    if (!existsSync(目标路径)) {
      记录错误(文件, `资源不存在「${匹配[2]}」`);
      continue;
    }

    if (
      片段 &&
      !片段.includes("=") &&
      extname(目标路径).toLowerCase() === ".html"
    ) {
      let 目标编号 = 网页编号缓存.get(目标路径);
      if (!目标编号) {
        目标编号 = 提取编号集合(readFileSync(目标路径, "utf8")).编号;
        网页编号缓存.set(目标路径, 目标编号);
      }
      if (!目标编号.has(片段)) {
        记录错误(文件, `锚点不存在「${匹配[2]}」`);
      }
    }
  }
}

for (const 文件 of 样式文件) {
  const 内容 = readFileSync(文件, "utf8");
  for (const 匹配 of 内容.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    const 地址 = 匹配[2].trim();
    if (!地址 || 地址.startsWith("#") || 地址.startsWith("data:")) continue;
    const 结果 = 解析本地地址(文件, 地址);
    if (结果 && !existsSync(结果.目标路径)) {
      记录错误(文件, `样式资源不存在「${地址}」`);
    }
  }
}

const 公共资源 = [
  "common-controls.js",
  "jonasblakewood-nature-519884.mp3",
  "images/导航缩略图/开篇.webp",
  "images/导航缩略图/壹.webp",
  "images/导航缩略图/贰.webp",
  "images/导航缩略图/叁.webp",
  "images/导航缩略图/肆.webp",
  "images/导航缩略图/伍.webp",
  "images/导航缩略图/陆.webp"
];

for (const 相对路径 of 公共资源) {
  if (!existsSync(resolve(项目目录, 相对路径))) {
    错误.push(`公共资源不存在：${相对路径}`);
  }
}

const 公共脚本路径 = resolve(项目目录, "common-controls.js");
const 公共脚本内容 = readFileSync(公共脚本路径, "utf8");
const 目录目标 = Array.from(
  公共脚本内容.matchAll(/\bpath:\s*"([^"]+)"/g),
  (匹配) => 匹配[1]
);

if (目录目标.length !== 7) {
  错误.push(`公共目录应包含 7 个章节，当前为 ${目录目标.length} 个`);
}

for (const 地址 of 目录目标) {
  const 结果 = 解析本地地址(公共脚本路径, 地址);
  if (!结果 || !existsSync(结果.目标路径)) {
    错误.push(`公共目录目标不存在：${地址}`);
    continue;
  }
  if (结果.片段 && !结果.片段.includes("=")) {
    let 目标编号 = 网页编号缓存.get(结果.目标路径);
    if (!目标编号) {
      目标编号 = 提取编号集合(readFileSync(结果.目标路径, "utf8")).编号;
      网页编号缓存.set(结果.目标路径, 目标编号);
    }
    if (!目标编号.has(结果.片段)) {
      错误.push(`公共目录锚点不存在：${地址}`);
    }
  }
}

if (错误.length) {
  console.error(错误.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `验证通过：${网页文件.length} 个网页、${样式文件.length} 个样式表的本地资源、锚点与 id 均有效。`
  );
}
