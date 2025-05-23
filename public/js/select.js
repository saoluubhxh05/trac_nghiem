// ✅ select.js đã thêm chọn ngôn ngữ và lọc theo ngôn ngữ
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
function khoiTaoDuLieuTheoNgonNgu() {
  const ngonNguSelect = document.getElementById("ngonNgu");
  const monHocSelect = document.getElementById("monHoc");
  const loaiSelect = document.getElementById("loai");

  const saved = JSON.parse(localStorage.getItem("quizSettings") || "{}");
  // ✅ Thêm đoạn kiểm tra này ngay sau dòng trên
  if (saved.language && questions.some((q) => q.language === saved.language)) {
    ngonNguSelect.value = saved.language;
  } else {
    localStorage.removeItem("quizSettings");
  }

  const language = ngonNguSelect.value;

  // ✅ Tạo danh sách Môn học
  const monHocSet = new Set();
  questions.forEach((q) => {
    if (q.language === language) monHocSet.add(q.monHoc);
  });

  monHocSelect.innerHTML = "";
  [...monHocSet].forEach((mh) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = mh;
    monHocSelect.appendChild(opt);
  });

  const monHoc = saved.monHoc || monHocSelect.options[0]?.value || "";
  monHocSelect.value = monHoc;

  // ✅ Tạo danh sách Loại
  const loaiSet = new Set();
  questions.forEach((q) => {
    if (q.monHoc === monHoc && q.language === language) loaiSet.add(q.loai);
  });

  loaiSelect.innerHTML = "";
  [...loaiSet].forEach((l) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = l;
    loaiSelect.appendChild(opt);
  });

  const loai = saved.loai || loaiSelect.options[0]?.value || "";
  loaiSelect.value = loai;

  if (saved.thuTu) {
    document.getElementById("thuTu").value = saved.thuTu;
  }

  renderChuDeTheoBoLoc();
}
function updateLoaiSelect(monHoc) {
  const loaiSelect = document.getElementById("loai");
  const ngonNguSelect = document.getElementById("ngonNgu");
  const language = ngonNguSelect.value;

  const loaiSet = new Set();
  questions.forEach((q) => {
    if (q.monHoc === monHoc && q.language === language) {
      loaiSet.add(q.loai);
    }
  });

  loaiSelect.innerHTML = "";
  [...loaiSet].forEach((l) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = l;
    loaiSelect.appendChild(opt);
  });

  // ✅ Gán loại đầu tiên nếu tồn tại
  loaiSelect.value = loaiSelect.options[0]?.value || "";
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  // ✅ Sắp xếp theo thứ tự bảng chữ cái và số (Unit 1, Unit 2, Unit 10...)
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

document.addEventListener("DOMContentLoaded", async () => {
  const snapshot = await getDocs(collection(db, "questions"));
  questions = snapshot.docs.map((doc) => doc.data());
  window.questions = questions;

  if (!questions.length) {
    alert("Không có dữ liệu câu hỏi! Vui lòng import trước.");
    return;
  }

  const monHocSelect = document.getElementById("monHoc");
  const loaiSelect = document.getElementById("loai");
  const ngonNguSelect = document.getElementById("ngonNgu");

  khoiTaoDuLieuTheoNgonNgu();

  monHocSelect.addEventListener("change", () => {
    updateLoaiSelect(monHocSelect.value);
    renderChuDeTheoBoLoc();
  });
  loaiSelect.addEventListener("change", renderChuDeTheoBoLoc);
  ngonNguSelect.addEventListener("change", khoiTaoDuLieuTheoNgonNgu);

  document.getElementById("batDauBtn").addEventListener("click", () => {
    const monHoc = monHocSelect.value;
    const loai = loaiSelect.value;
    const language = ngonNguSelect.value;
    const thuTu = document.getElementById("thuTu").value;

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
        filtered = shuffleArray(filtered);
      } else {
        filtered = filtered.sort((a, b) => (a.stt || 0) - (b.stt || 0));
      }

      selectedQuestions = selectedQuestions.concat(filtered.slice(0, soCau));
    });

    if (!selectedQuestions.length) {
      alert("Không tìm thấy câu hỏi phù hợp.");
      return;
    }

    localStorage.setItem("loaiBaiTapList", JSON.stringify(loaiBaiTapList));
    localStorage.setItem("currentLoaiBaiTapIndex", 0);
    localStorage.setItem(
      "selectedQuestions",
      JSON.stringify(selectedQuestions)
    );

    const translateTimeInput = document.getElementById("translateTime");
    if (translateTimeInput) {
      localStorage.setItem("translateTime", translateTimeInput.value);
    }

    window.location.href = `${loaiBaiTapList[0]}.html`;
  });
});
