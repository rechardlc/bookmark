import type {
  DuplicateGroup,
  ExtensionRequest,
  ExtensionResponse,
  ScanResult
} from "../core/types";
import "./options.css";

const app = document.querySelector<HTMLDivElement>("#app");

let scanResult: ScanResult | undefined;
let activeTab: "overview" | "duplicates" | "classification" | "backups" = "overview";
let statusMessage = "";

render();
void refreshScan();

async function sendRequest<T>(request: ExtensionRequest): Promise<T> {
  const response = (await chrome.runtime.sendMessage(request)) as ExtensionResponse<T>;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

async function refreshScan() {
  statusMessage = "正在扫描书签...";
  render();
  try {
    scanResult = await sendRequest<ScanResult>({ type: "scan" });
    statusMessage = "扫描完成";
  } catch (error) {
    statusMessage = error instanceof Error ? error.message : "扫描失败";
  }
  render();
}

function render() {
  if (!app) return;

  app.innerHTML = `
    <section class="page">
      <header class="header">
        <div>
          <h1>Bookmark Manager</h1>
          <p>${escapeHtml(statusMessage || "本地整理 Chrome 书签，先备份再清理。")}</p>
        </div>
        <button id="refresh" type="button">重新扫描</button>
      </header>
      <nav class="tabs">
        ${tabButton("overview", "概览")}
        ${tabButton("duplicates", "重复清理")}
        ${tabButton("classification", "自动分类")}
        ${tabButton("backups", "备份恢复")}
      </nav>
      <section class="panel">${renderPanel()}</section>
    </section>
  `;

  document.querySelector("#refresh")?.addEventListener("click", () => void refreshScan());
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab as typeof activeTab;
      render();
    });
  });
  document.querySelector("#cleanup-exact")?.addEventListener("click", () => void cleanupExact());
  document.querySelector("#create-backup")?.addEventListener("click", () => void createBackup());
  document.querySelector("#export-json")?.addEventListener("click", () => void exportLatest("json"));
  document.querySelector("#export-html")?.addEventListener("click", () => void exportLatest("html"));
  document.querySelector("#restore-latest")?.addEventListener("click", () => void restoreLatest());
}

function tabButton(id: typeof activeTab, label: string) {
  return `<button class="${activeTab === id ? "active" : ""}" data-tab="${id}" type="button">${label}</button>`;
}

function renderPanel() {
  if (!scanResult) return "<p>正在扫描书签...</p>";
  if (activeTab === "overview") return renderOverview();
  if (activeTab === "duplicates") return renderDuplicates();
  if (activeTab === "classification") return renderClassification();
  return renderBackups();
}

function renderOverview() {
  return `
    <div class="stats">
      <article><strong>${scanResult?.bookmarkCount ?? 0}</strong><span>书签</span></article>
      <article><strong>${scanResult?.folderCount ?? 0}</strong><span>文件夹</span></article>
      <article><strong>${scanResult?.duplicateGroups.length ?? 0}</strong><span>重复组</span></article>
      <article><strong>${scanResult?.classificationProposals.length ?? 0}</strong><span>分类建议</span></article>
    </div>
  `;
}

function renderDuplicates() {
  const exact = scanResult?.duplicateGroups.filter((group) => group.confidence === "low-risk") ?? [];
  const review = scanResult?.duplicateGroups.filter((group) => group.confidence !== "low-risk") ?? [];
  const deleteIds = exact.flatMap((group) =>
    group.candidates.filter((candidate) => candidate.action === "delete").map((candidate) => candidate.id)
  );

  return `
    <div class="toolbar">
      <button id="cleanup-exact" type="button" ${deleteIds.length === 0 ? "disabled" : ""}>
        备份并自动删除 ${deleteIds.length} 个完全重复项
      </button>
    </div>
    <h2>可自动清理</h2>
    ${exact.map(renderDuplicateGroup).join("") || "<p>没有发现可自动清理的完全重复书签。</p>"}
    <h2>需要人工确认</h2>
    ${review.map(renderDuplicateGroup).join("") || "<p>没有发现需要人工确认的相似重复组。</p>"}
  `;
}

function renderDuplicateGroup(group: DuplicateGroup) {
  return `
    <article class="group">
      <h3>${escapeHtml(group.reason)}</h3>
      <table>
        <thead><tr><th>动作</th><th>标题</th><th>URL</th><th>路径</th></tr></thead>
        <tbody>
          ${group.candidates
            .map(
              (candidate) => `
                <tr>
                  <td>${candidate.action}</td>
                  <td>${escapeHtml(candidate.title)}</td>
                  <td>${escapeHtml(candidate.url)}</td>
                  <td>${escapeHtml(candidate.path.join(" / "))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </article>
  `;
}

function renderClassification() {
  const rows = scanResult?.classificationProposals ?? [];
  return `
    <table>
      <thead><tr><th>标题</th><th>来源</th><th>目标分类</th><th>原因</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.sourcePath.join(" / "))}</td>
                <td>${escapeHtml(row.destinationFolderTitle)}</td>
                <td>${escapeHtml(row.reason)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderBackups() {
  const latest = scanResult?.latestBackup;
  return `
    <div class="toolbar">
      <button id="create-backup" type="button">立即备份</button>
      <button id="export-json" type="button" ${latest ? "" : "disabled"}>导出 JSON</button>
      <button id="export-html" type="button" ${latest ? "" : "disabled"}>导出 HTML</button>
      <button id="restore-latest" type="button" ${latest ? "" : "disabled"}>恢复最近备份</button>
    </div>
    <p>${latest ? `最近备份：${escapeHtml(latest.createdAt)}` : "还没有备份。"}</p>
  `;
}

async function cleanupExact() {
  const ids =
    scanResult?.duplicateGroups
      .filter((group) => group.confidence === "low-risk")
      .flatMap((group) =>
        group.candidates.filter((candidate) => candidate.action === "delete").map((candidate) => candidate.id)
      ) ?? [];
  if (ids.length === 0) return;
  statusMessage = "正在备份并清理完全重复项...";
  render();
  try {
    await sendRequest({ type: "cleanup-exact-duplicates", bookmarkIds: ids });
    await refreshScan();
  } catch (error) {
    statusMessage = error instanceof Error ? error.message : "清理失败";
    render();
  }
}

async function createBackup() {
  statusMessage = "正在创建备份...";
  render();
  try {
    await sendRequest({ type: "create-backup" });
    await refreshScan();
  } catch (error) {
    statusMessage = error instanceof Error ? error.message : "备份失败";
    render();
  }
}

async function exportLatest(format: "json" | "html") {
  const backupId = scanResult?.latestBackup?.id;
  if (!backupId) return;
  try {
    await sendRequest({ type: "export-backup", backupId, format });
  } catch (error) {
    statusMessage = error instanceof Error ? error.message : "导出失败";
    render();
  }
}

async function restoreLatest() {
  const backupId = scanResult?.latestBackup?.id;
  if (!backupId) return;
  const confirmed = window.confirm("恢复是高风险操作。当前版本会先记录恢复请求并保留安全备份。继续？");
  if (!confirmed) return;
  statusMessage = "正在记录恢复请求并创建安全备份...";
  render();
  try {
    await sendRequest({ type: "restore-backup", backupId });
    await refreshScan();
  } catch (error) {
    statusMessage = error instanceof Error ? error.message : "恢复请求失败";
    render();
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
