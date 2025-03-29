export function chuyenBaiTiepTheo() {
  const loaiBaiTapList = JSON.parse(
    localStorage.getItem("loaiBaiTapList") || "[]"
  );
  let currentLoaiBaiTapIndex = parseInt(
    localStorage.getItem("currentLoaiBaiTapIndex") || 0
  );

  currentLoaiBaiTapIndex++;

  if (currentLoaiBaiTapIndex < loaiBaiTapList.length) {
    localStorage.setItem("currentLoaiBaiTapIndex", currentLoaiBaiTapIndex);
    window.location.href = `${loaiBaiTapList[currentLoaiBaiTapIndex]}.html`;
  } else {
    localStorage.removeItem("loaiBaiTapList");
    localStorage.removeItem("currentLoaiBaiTapIndex");
    localStorage.removeItem("selectedQuestions");
    window.location.href = "index.html";
  }
}

export function taoNutBaiTiepTheo(container) {
  const nextTypeBtn = document.createElement("button");
  nextTypeBtn.textContent = "➡️ Chuyển sang bài tiếp theo";
  nextTypeBtn.onclick = chuyenBaiTiepTheo;
  nextTypeBtn.style.marginTop = "20px";
  container.appendChild(nextTypeBtn);
}
