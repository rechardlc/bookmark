import "./popup.css";

const popup = document.querySelector<HTMLDivElement>("#popup");

if (popup) {
  popup.innerHTML = `
    <section class="popup">
      <h1>Bookmark Manager</h1>
      <button id="open-options" type="button">打开管理页</button>
    </section>
  `;

  document.querySelector("#open-options")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

