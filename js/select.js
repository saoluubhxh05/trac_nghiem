// js/select.js
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

document.addEventListener("DOMContentLoaded", async () => {
  const snapshot = await getDocs(collection(db, "questions"));
  const questions = snapshot.docs.map((doc) => doc.data());
  window.questions = questions;

  if (!questions.length) {
    alert("Không có dữ liệu câu hỏi! Vui lòng import trước.");
    return;
  }

  const monHocSelect = document.getElementById("monHoc");
  const loaiSelect = document.getElementById("loai");

  const monHocSet = new Set();
  questions.forEach((q) => monHocSet.add(q.monHoc));

  [...monHocSet].forEach((mh) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = mh;
    monHocSelect.appendChild(opt);
  });

  function updateLoaiSelect(monHoc) {
    loaiSelect.innerHTML = "";
    const loaiSet = new Set();
    questions.forEach((q) => {
      if (q.monHoc === monHoc) loaiSet.add(q.loai);
    });
    [...loaiSet].forEach((l) => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = l;
      loaiSelect.appendChild(opt);
    });
  }

  const saved = JSON.parse(localStorage.getItem("quizSettings") || "{}");
  const initialMonHoc = saved.monHoc || monHocSelect.options[0]?.value;
  if (initialMonHoc) {
    monHocSelect.value = initialMonHoc;
    updateLoaiSelect(initialMonHoc);
  }

  if (saved.loai) loaiSelect.value = saved.loai;
  if (saved.thuTu) document.getElementById("thuTu").value = saved.thuTu;

  monHocSelect.addEventListener("change", () => {
    updateLoaiSelect(monHocSelect.value);
    renderChuDeTheoBoLoc();
  });

  loaiSelect.addEventListener("change", renderChuDeTheoBoLoc);
  renderChuDeTheoBoLoc();

  setTimeout(() => {
    if (saved.chuDe) {
      saved.chuDe.forEach(({ chuDe, soCau }) => {
        const chk = document.querySelector(
          `.chu-de-checkbox[value="${chuDe}"]`
        );
        if (chk) {
          chk.checked = true;
          const input =
            chk.parentElement.parentElement.querySelector(".so-cau-input");
          if (input) input.value = soCau;
        }
      });
    }

    if (saved.loaiBaiTapList) {
      saved.loaiBaiTapList.forEach((lb) => {
        const cb = document.querySelector(
          `#loaiBaiTapContainer input[value="${lb}"]`
        );
        if (cb) cb.checked = true;
      });
    }
  }, 100);

  document.getElementById("batDauBtn").addEventListener("click", () => {
    const monHoc = monHocSelect.value;
    const loai = loaiSelect.value;
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

      let filtered = questions.filter(
        (q) => q.monHoc === monHoc && q.loai === loai && q.chuDe === chuDe
      );

      if (thuTu === "ngaunhien") {
        filtered = shuffleArray(filtered);
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

    window.location.href = `${loaiBaiTapList[0]}.html`;
  });
});

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
  const chuDeContainer = document.getElementById("chuDeContainer");
  chuDeContainer.innerHTML = "";

  const chuDeMap = new Map();

  questions.forEach((q) => {
    if (q.monHoc === monHoc && q.loai === loai) {
      chuDeMap.set(q.chuDe, (chuDeMap.get(q.chuDe) || 0) + 1);
    }
  });

  if (chuDeMap.size === 0) {
    chuDeContainer.innerHTML = `<p style="color:red;">❌ Không có chủ đề nào phù hợp với môn "${monHoc}" và loại "${loai}".</p>`;
    return;
  }

  chuDeMap.forEach((count, cd) => {
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
