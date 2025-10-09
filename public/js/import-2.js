// import-2.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
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

const XLSX_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

async function loadXLSX() {
  if (!window.XLSX) {
    await import(XLSX_URL);
  }
}

const popupImport = document.getElementById("popupImport");
const popupFile = document.getElementById("popupFile");
const selectionList = document.getElementById("selectionList");
const previewBody = document.getElementById("previewBody");

popupImport.addEventListener("click", async () => {
  const file = popupFile.files[0];
  if (!file) {
    alert("Vui lòng chọn file.");
    return;
  }

  await loadXLSX();

  const reader = new FileReader();
  reader.onload = async function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json.length || !json[0]["Phần"]) {
      alert("❌ Không tìm thấy cột 'Phần' trong file Excel.");
      return;
    }

    const partName = json[0]["Phần"].toString().trim();
    const collectionName = `selection_${partName.replace(/\s+/g, "_")}`;

    const raw = json.map((row, index) => ({
      stt: index + 1,
      monHoc: row["Môn học"] || "",
      loai: row["Loai"] || "",
      chuDe: row["Chu de"] || "",
      cauHoi: row["Cau hoi"] || "",
      dapAn: row["Dap an"] || "",
      dichDapAn: row["Dich dap an"] || "",
      phuongAn1: row["Phuong an 1"] || "",
      phuongAn2: row["Phuong an 2"] || "",
      phuongAn3: row["Phuong an 3"] || "",
      phuongAn4: row["Phuong an 4"] || "",
      tenAnh: row["Ten anh"] || "",
      language: row["Ngon ngu"] || "vi",
      // Thêm cột từ vựng từ yêu cầu trước
      tuVung1: row["Từ vựng 1"] || "",
      dichTuVung1: row["Dịch từ vựng 1"] || "",
      tuVung2: row["Từ vựng 2"] || "",
      dichTuVung2: row["Dịch từ vựng 2"] || "",
      tuVung3: row["Từ vựng 3"] || "",
      dichTuVung3: row["Dịch từ vựng 3"] || "",
      tuVung4: row["Từ vựng 4"] || "",
      dichTuVung4: row["Dịch từ vựng 4"] || "",
      tuVung5: row["Từ vựng 5"] || "",
      dichTuVung5: row["Dịch từ vựng 5"] || "",
      tuVung6: row["Từ vựng 6"] || "",
      dichTuVung6: row["Dịch từ vựng 6"] || "",
    }));

    // Xóa dữ liệu cũ
    const querySnapshot = await getDocs(collection(db, collectionName));
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, collectionName, docSnapshot.id));
    }

    // Thêm dữ liệu mới
    for (const item of raw) {
      await addDoc(collection(db, collectionName), item);
    }

    alert("✅ Import thành công!");
  };

  reader.readAsArrayBuffer(file);
});

// Phần loadSelections và preview giữ nguyên từ DOCUMENT (không thay đổi)
async function loadSelections() {
  selectionList.innerHTML = "";
  const metaSnap = await getDocs(collection(db, "selectionMeta"));
  const collections = metaSnap.docs.map((doc) => doc.data().name);

  for (const colName of collections) {
    const row = document.createElement("tr");
    const name = colName.replace("selection_", "").replace(/_/g, " ");
    const nameCell = document.createElement("td");
    nameCell.textContent = name;
    nameCell.style.cursor = "pointer";
    nameCell.onclick = () => previewSelection(colName);

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌ Xóa";
    delBtn.onclick = async () => {
      const snap = await getDocs(collection(db, colName));
      await Promise.all(
        snap.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)))
      );

      const metaSnap = await getDocs(collection(db, "selectionMeta"));
      const metaDoc = metaSnap.docs.find((d) => d.data().name === colName);
      if (metaDoc) await deleteDoc(doc(db, "selectionMeta", metaDoc.id));

      loadSelections();
      previewBody.innerHTML = "";
    };

    const actionCell = document.createElement("td");
    actionCell.appendChild(delBtn);

    row.appendChild(nameCell);
    row.appendChild(actionCell);
    selectionList.appendChild(row);
  }
}

async function previewSelection(colName) {
  const snap = await getDocs(collection(db, colName));
  const data = snap.docs.map((doc) => doc.data());
  data.sort((a, b) => (a.stt || 0) - (b.stt || 0));
  previewBody.innerHTML = "";
  data.forEach((q, i) => {
    const r = document.createElement("tr");
    r.innerHTML = `
      <td>${i + 1}</td>
      <td>${q.monHoc}</td>
      <td>${q.loai}</td>
      <td>${q.chuDe}</td>
      <td>${q.cauHoi}</td>
      <td>${q.dapAn}</td>`;
    previewBody.appendChild(r);
  });
}

window.addEventListener("DOMContentLoaded", loadSelections);
