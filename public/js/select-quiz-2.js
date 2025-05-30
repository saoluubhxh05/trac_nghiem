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

let allQuestions = [];

async function loadSelectionList() {
  const metaSnap = await getDocs(collection(db, "selectionMeta"));
  const selectBox = document.getElementById("selection");
  selectBox.innerHTML = "";

  metaSnap.docs.forEach((doc) => {
    const name = doc.data().name.replace("selection_", "").replace(/_/g, " ");
    const opt = document.createElement("option");
    opt.value = doc.data().name;
    opt.textContent = name;
    selectBox.appendChild(opt);
  });

  // Load lần đầu
  if (selectBox.options.length > 0) {
    selectBox.value = selectBox.options[0].value;
    await loadQuestionsFromSelection(selectBox.value);
    khoiTaoBoLoc();
  }

  selectBox.addEventListener("change", async () => {
    await loadQuestionsFromSelection(selectBox.value);
    khoiTaoBoLoc();
  });
}

async function loadQuestionsFromSelection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  allQuestions = snap.docs.map((doc) => doc.data());
}

function khoiTaoBoLoc() {
  const langBox = document.getElementById("ngonNgu");
  const monHocBox = document.getElementById("monHoc");
  const loaiBox = document.getElementById("loai");

  const language = langBox.value;

  // lọc môn học
  const monSet = new Set();
  allQuestions.forEach((q) => {
    if (q.language === language) monSet.add(q.monHoc);
  });
  monHocBox.innerHTML = "";
  [...monSet].forEach((m) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = m;
    monHocBox.appendChild(opt);
  });

  // chọn môn học đầu
  const firstMon = monHocBox.options[0]?.value || "";
  monHocBox.value = firstMon;

  // lọc loại
  const loaiSet = new Set();
  allQuestions.forEach((q) => {
    if (q.language === language && q.monHoc === firstMon) loaiSet.add(q.loai);
  });
  loaiBox.innerHTML = "";
  [...loaiSet].forEach((l) => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = l;
    loaiBox.appendChild(opt);
  });

  renderChuDe();
}

function renderChuDe() {
  const mon = document.getElementById("monHoc").value;
  const loai = document.getElementById("loai").value;
  const lang = document.getElementById("ngonNgu").value;
  const chuDeContainer = document.getElementById("chuDeContainer");
  chuDeContainer.innerHTML = "";

  const chuDeMap = new Map();
  allQuestions
    .filter((q) => q.monHoc === mon && q.loai === loai && q.language === lang)
    .forEach((q) => {
      chuDeMap.set(q.chuDe, (chuDeMap.get(q.chuDe) || 0) + 1);
    });

  [...chuDeMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "vi", { numeric: true }))
    .forEach(([cd, count]) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label><input type="checkbox" value="${cd}" class="chu-de-checkbox" data-max="${count}"/> ${cd}</label>
        <input type="number" value="${count}" max="${count}" min="1" style="width: 60px;" class="so-cau-input"/>
        <span style="font-size:12px; color:gray;">(Tối đa: ${count})</span>
      `;
      chuDeContainer.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSelectionList();

  const langBox = document.getElementById("ngonNgu");
  const monBox = document.getElementById("monHoc");
  const loaiBox = document.getElementById("loai");

  langBox.addEventListener("change", khoiTaoBoLoc);
  monBox.addEventListener("change", khoiTaoBoLoc);
  loaiBox.addEventListener("change", renderChuDe);

  document.getElementById("batDauBtn").addEventListener("click", () => {
    const mon = monBox.value;
    const loai = loaiBox.value;
    const lang = langBox.value;
    const thuTu = document.getElementById("thuTu").value;
    const loaiBaiTap = Array.from(
      document.querySelectorAll("#loaiBaiTap input:checked")
    ).map((el) => el.value);

    const chuDeChons = Array.from(
      document.querySelectorAll(".chu-de-checkbox:checked")
    ).map((chk) => {
      const soCau = parseInt(
        chk.parentElement.parentElement.querySelector(".so-cau-input").value
      );
      return { chuDe: chk.value, soCau };
    });

    if (!loaiBaiTap.length || !chuDeChons.length) {
      alert("Vui lòng chọn loại bài tập và chủ đề.");
      return;
    }

    const selectedQuestions = [];
    chuDeChons.forEach(({ chuDe, soCau }) => {
      let filtered = allQuestions.filter(
        (q) =>
          q.monHoc === mon &&
          q.loai === loai &&
          q.language === lang &&
          q.chuDe === chuDe
      );
      if (thuTu === "ngaunhien")
        filtered = filtered.sort(() => 0.5 - Math.random());
      else filtered = filtered.sort((a, b) => (a.stt || 0) - (b.stt || 0));

      selectedQuestions.push(...filtered.slice(0, soCau));
    });

    if (!selectedQuestions.length) {
      alert("Không tìm thấy câu hỏi phù hợp.");
      return;
    }

    localStorage.setItem(
      "quizSettings",
      JSON.stringify({
        monHoc: mon,
        loai: loai,
        language: lang,
        loaiBaiTapList: loaiBaiTap,
        chuDe: chuDeChons,
        thuTu,
      })
    );
    localStorage.setItem(
      "selectedQuestions",
      JSON.stringify(selectedQuestions)
    );
    localStorage.setItem("loaiBaiTapList", JSON.stringify(loaiBaiTap));
    localStorage.setItem("currentLoaiBaiTapIndex", 0);

    const translateTime = document.getElementById("translateTime");
    if (translateTime) {
      localStorage.setItem("translateTime", translateTime.value);
    }

    let firstType = loaiBaiTap[0];
    if (firstType === "translate") {
      firstType = lang === "zh" ? "translate-zh" : "translate-en";
    }

    window.location.href = `${firstType}.html`;
  });
});
