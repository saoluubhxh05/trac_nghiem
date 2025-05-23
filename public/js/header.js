// js/header.js
document.addEventListener("DOMContentLoaded", () => {
  const header = document.createElement("div");
  header.id = "fixedHeader";
  header.innerHTML = `
    <button onclick="location.href='index.html'">🏠 Home</button>
    <div id="loginArea"></div>
  `;
  document.body.prepend(header);

  const style = document.createElement("style");
  style.textContent = `
    #fixedHeader {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: white;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 1000;
    }
    body {
      padding-top: 60px;
    }
  `;
  document.head.appendChild(style);
});
