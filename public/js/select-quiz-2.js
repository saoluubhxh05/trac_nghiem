import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvNfpf4KQeJw9fuDkTyXdoDY3LEuUL1fc",
  authDomain: "abcd-9d83a.firebaseapp.com",
  projectId: "abcd-9d83a",
  storageBucket: "abcd-9d83a.appspot.com",
  messagingSenderId: "380338460918",
  appId: "1:380338460918:web:d1b1d7c9bc40471ded34d7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let questions = [];

function shuffle(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getUniqueValues(field, filterFn = () => true) {
  const set = new Set();
  questions.filter(filterFn).forEach((q) => set.add(q[field]));
  return Array.from(set).sort();
}

function updateSelectOptions(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";

  if (options.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Không có dữ liệu --";
    select.appendChild(opt);
    return;
  }

  if (options.length === 1) {
    const opt = document.createElement("option");
    opt.value = opt.textContent = options[0];
    select.appendChild(opt);
    select.value = options[0];
    select.dispatchEvent(new Event("change"));
    return;
  }

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = `-- Chọn ${selectId} --`;
  select.appendChild(defaultOpt);

  options.forEach((optVal) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = optVal;
    select.appendChild(opt);
  });
}

function renderChuDeTheoBoLoc() {
  const monHoc = document.getElementById("monHoc").value;
  const loai = document.getElementById("loai").value;
  const language = document.getElementById("ngonNgu").value;
  const chuDeContainer = document.getElementById("chuDeContainer");
  chuDeContainer.innerHTML = "";

  const chuDeMap = new Map();
  questions
    .filter(
      (q) => q.monHoc === monHoc && q.loai === loai && q.language === language
    )
    .forEach((q) => {
      chuDeMap.set(q.chuDe, (chuDeMap.get(q.chuDe) || 0) + 1);
    });

  if (chuDeMap.size === 0) {
    chuDeContainer.innerHTML = `<p style="color:red;">❌ Không có chủ đề nào phù hợp với bộ lọc.</p>`;
    return;
  }

  [...chuDeMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "vi", { numeric: true }))
    .forEach(([cd, count]) => {
      const row = document.createElement("div");
      row.style.marginBottom = "8px";
      row.innerHTML = `
        <label>
          <input type="checkbox" value="${cd}" data-max="${count}" class="chu-de-checkbox" />
          ${cd}
        </label>
        <input type="number" class="so-cau-input" value="${count}" min="1" max="${count}" style="width: 60px; margin-left: 10px;" />
        <span style="font-size: 12px; color: gray;">(Tối đa: ${count})</span>
      `;
      chuDeContainer.appendChild(row);
    });
}

async function loadSelectionList() {
  const metaSnap = await getDocs(collection(db, "selectionMeta"));
  const list = metaSnap.docs.map((doc) =>
    doc.data().name.replace("selection_", "")
  );
  updateSelectOptions("danhSach", list);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSelectionList();

  const saved = JSON.parse(localStorage.getItem("quizSettings") || "{}");
  if (saved.danhSach) {
    document.getElementById("danhSach").value = saved.danhSach;
    document.getElementById("danhSach").dispatchEvent(new Event("change"));
  }

  document.getElementById("danhSach").addEventListener("change", async () => {
    const ds = document.getElementById("danhSach").value;
    if (!ds) return;

    const collectionName = `selection_${ds}`;
    const snapshot = await getDocs(collection(db, collectionName));
    questions = snapshot.docs.map((doc) => doc.data());

    if (!questions.length) {
      alert("Không có dữ liệu trong danh sách này.");
      return;
    }

    updateSelectOptions("ngonNgu", getUniqueValues("language"));
    updateSelectOptions("monHoc", getUniqueValues("monHoc"));
    updateSelectOptions("loai", getUniqueValues("loai"));

    // Gán lại các lựa chọn từ localStorage nếu có
    const saved = JSON.parse(localStorage.getItem("quizSettings") || "{}");
    if (saved.language)
      document.getElementById("ngonNgu").value = saved.language;
    if (saved.monHoc) document.getElementById("monHoc").value = saved.monHoc;
    if (saved.loai) document.getElementById("loai").value = saved.loai;

    renderChuDeTheoBoLoc();

    // Khôi phục chủ đề và số câu
    setTimeout(() => {
      if (saved.chuDe) {
        saved.chuDe.forEach(({ chuDe, soCau }) => {
          const chk = [...document.querySelectorAll(".chu-de-checkbox")].find(
            (c) => c.value === chuDe
          );
          if (chk) {
            chk.checked = true;
            const input =
              chk.parentElement.parentElement.querySelector(".so-cau-input");
            if (input) input.value = soCau;
          }
        });
      }
    }, 100);
  });

  ["ngonNgu", "monHoc", "loai"].forEach((id) => {
    document
      .getElementById(id)
      .addEventListener("change", renderChuDeTheoBoLoc);
  });

  // Khôi phục loại bài tập và thứ tự nếu có
  if (saved.loaiBaiTapList) {
    saved.loaiBaiTapList.forEach((val) => {
      const el = document.querySelector(
        `#loaiBaiTapContainer input[value="${val}"]`
      );
      if (el) el.checked = true;
    });
  }
  if (saved.thuTu) document.getElementById("thuTu").value = saved.thuTu;

  document.getElementById("batDauBtn").addEventListener("click", () => {
    const monHoc = document.getElementById("monHoc").value;
    const loai = document.getElementById("loai").value;
    const language = document.getElementById("ngonNgu").value;
    const thuTu = document.getElementById("thuTu").value;
    const danhSach = document.getElementById("danhSach").value;

    const loaiBaiTapEls = document.querySelectorAll(
      "#loaiBaiTapContainer input:checked"
    );
    const loaiBaiTapList = Array.from(loaiBaiTapEls).map((el) => el.value);
    if (!loaiBaiTapList.length) {
      alert("Vui lòng chọn ít nhất 1 loại bài tập.");
      return;
    }

    const chuDeCheckboxes = document.querySelectorAll(
      ".chu-de-checkbox:checked"
    );
    if (!chuDeCheckboxes.length) {
      alert("Vui lòng chọn ít nhất 1 chủ đề!");
      return;
    }

    const savedSettings = {
      danhSach,
      monHoc,
      loai,
      language,
      loaiBaiTapList,
      thuTu,
      chuDe: Array.from(chuDeCheckboxes).map((chk) => {
        const chuDe = chk.value;
        const soCau = parseInt(
          chk.parentElement.parentElement.querySelector(".so-cau-input").value
        );
        return { chuDe, soCau };
      }),
    };
    localStorage.setItem("quizSettings", JSON.stringify(savedSettings));

    let selectedQuestions = [];
    chuDeCheckboxes.forEach((chk) => {
      const chuDe = chk.value;
      const input =
        chk.parentElement.parentElement.querySelector(".so-cau-input");
      const soCau = parseInt(input.value);

      let filtered;
      if (loaiBaiTapList.includes("combo")) {
        filtered = questions.filter(
          (q) =>
            q.monHoc === monHoc && q.chuDe === chuDe && q.language === language
        );
      } else {
        filtered = questions.filter(
          (q) =>
            q.monHoc === monHoc &&
            q.loai === loai &&
            q.chuDe === chuDe &&
            q.language === language
        );
      }

      if (thuTu === "ngaunhien") {
        filtered = shuffle(filtered);
      } else {
        filtered = filtered.sort((a, b) => (a.stt || 0) - (b.stt || 0));
      }

      selectedQuestions = selectedQuestions.concat(filtered.slice(0, soCau));
    });

    if (!selectedQuestions.length) {
      alert("Không tìm thấy câu hỏi phù hợp.");
      return;
    }

    localStorage.setItem(
      "selectedQuestions",
      JSON.stringify(selectedQuestions)
    );

    if (loaiBaiTapList.length === 1 && loaiBaiTapList[0] === "translate") {
      window.location.href =
        language === "zh" ? "translate-zh.html" : "translate-en.html";
    } else if (loaiBaiTapList.includes("combo")) {
      window.location.href = "combo.html";
    } else if (loaiBaiTapList.includes("memorize")) {
      window.location.href = "memorize.html";
    } else {
      window.location.href = "index.html";
    }
  });
});
document.getElementById("resetSettingsBtn").addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xoá toàn bộ thiết lập cũ không?")) {
    localStorage.removeItem("quizSettings");
    localStorage.removeItem("selectedQuestions");
    localStorage.removeItem("loaiBaiTapList");
    localStorage.removeItem("currentLoaiBaiTapIndex");
    alert("✅ Đã xoá thiết lập. Trang sẽ được tải lại.");
    location.reload();
  }
});
