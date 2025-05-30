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
      loai: row["Loại"] || "",
      chuDe: row["Chủ đề"] || "",
      cauHoi:
        row["Câu trắc nghiệm"] || row["Dịch sang tiếng Việt Câu hỏi"] || "",
      dapAn: row["Đáp án đúng"] || "",
      phuongAn1:
        row["Phương án 1"] || row["Các phương án"]?.split("#")[0] || "",
      phuongAn2:
        row["Phương án 2"] || row["Các phương án"]?.split("#")[1] || "",
      phuongAn3:
        row["Phương án 3"] || row["Các phương án"]?.split("#")[2] || "",
      phuongAn4:
        row["Phương án 4"] || row["Các phương án"]?.split("#")[3] || "",
      tenAnh: row["tenAnh"] || "",
      language: row["Ngôn ngữ"] || "vi",
    }));

    const questions = raw.filter(
      (q) => q.monHoc && q.loai && q.chuDe && q.cauHoi && q.dapAn
    );

    const colRef = collection(db, collectionName);

    try {
      // 🔁 Xóa toàn bộ nếu đã tồn tại
      const existingDocs = await getDocs(colRef);
      if (!existingDocs.empty) {
        const confirmDelete = confirm(
          `⚠️ Danh sách "${partName}" đã tồn tại. Bạn có muốn ghi đè (xoá toàn bộ cũ và ghi mới)?`
        );
        if (!confirmDelete) return;

        await Promise.all(
          existingDocs.docs.map((docSnap) => deleteDoc(docSnap.ref))
        );
      }

      // ✅ Import mới
      await Promise.all(questions.map((q) => addDoc(colRef, q)));

      // ✅ Ghi metadata
      const metaSnap = await getDocs(collection(db, "selectionMeta"));
      const existedMeta = metaSnap.docs.find(
        (d) => d.data().name === collectionName
      );
      if (existedMeta) {
        await deleteDoc(doc(db, "selectionMeta", existedMeta.id));
      }
      await addDoc(collection(db, "selectionMeta"), {
        name: collectionName,
        createdAt: Date.now(),
      });

      alert(`✅ Đã import ${questions.length} câu hỏi vào: ${partName}`);
      document.getElementById("popupOverlay").click();
      loadSelections();
    } catch (err) {
      console.error("❌ Lỗi khi import:", err);
      alert("❌ Có lỗi xảy ra khi import dữ liệu.");
    }
  };

  reader.readAsArrayBuffer(file);
});

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
