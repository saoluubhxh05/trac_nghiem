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
    console.log("XLSX library loaded successfully.");
  }
}

const popupImport = document.getElementById("popupImport");
const popupFile = document.getElementById("popupFile");
const selectionList = document.getElementById("selectionList");
const previewBody = document.getElementById("previewBody");

if (!popupImport || !popupFile || !selectionList || !previewBody) {
  console.error("❌ Lỗi: Một hoặc nhiều element DOM không tìm thấy:", {
    popupImport,
    popupFile,
    selectionList,
    previewBody,
  });
} else {
  console.log("DOM elements loaded successfully.");
}

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
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "", header: 1 }); // Lấy tất cả row, bao gồm header

    console.log("Raw JSON from Excel:", json); // Debug: Kiểm tra toàn bộ dữ liệu

    if (!json.length || !json[0].includes("Phần")) {
      alert("❌ Không tìm thấy cột 'Phần' trong file Excel.");
      return;
    }

    const headers = json[0]; // Lấy header từ hàng đầu tiên
    const partIndex = headers.indexOf("Phần");
    if (partIndex === -1) {
      alert("❌ Không tìm thấy cột 'Phần' trong header.");
      return;
    }

    const partName = json[1][partIndex]?.toString().trim() || "default"; // Lấy giá trị Phần từ hàng 2
    const collectionName = `selection_${partName.replace(/\s+/g, "_")}`;

    const raw = json.slice(1).map((row, index) => {
      const rowObj = {};
      headers.forEach((header, i) => {
        rowObj[header.trim()] = row[i] || ""; // Map header với giá trị, loại bỏ khoảng trắng
      });

      console.log(`Row ${index + 2} data:`, rowObj); // Debug: Kiểm tra từng row sau map

      const tuVungRaw =
        rowObj["Từ vựng"] || rowObj["tuvung"] || rowObj["TỪ VỰNG"] || "";
      const dichTuVungRaw =
        rowObj["Dịch từ vựng"] ||
        rowObj["dichtuvung"] ||
        rowObj["DỊCH TỪ VỰNG"] ||
        "";

      const tuVung = tuVungRaw
        .split(";")
        .map((t) => t.trim())
        .filter((t) => t); // Giữ nguyên filter
      const dichTuVung = dichTuVungRaw
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d);

      if (
        tuVung.length !== dichTuVung.length &&
        (tuVung.length > 0 || dichTuVung.length > 0)
      ) {
        console.warn(
          `Row ${index + 2}: Số lượng từ vựng (${
            tuVung.length
          }) không khớp với dịch (${dichTuVung.length})`
        );
      }

      return {
        stt: index + 1,
        monHoc: rowObj["Môn học"] || "",
        loai: rowObj["Loại"] || "",
        chuDe: rowObj["Chủ đề"] || "",
        cauHoi:
          rowObj["Câu trắc nghiệm"] ||
          rowObj["Dịch sang tiếng Việt Câu hỏi"] ||
          "",
        dapAn: rowObj["Đáp án đúng"] || "",
        dichDapAn: rowObj["Dịch đáp án"] || "",
        phuongAn1:
          rowObj["Phương án 1"] || rowObj["Các phương án"]?.split("#")[0] || "",
        phuongAn2:
          rowObj["Phương án 2"] || rowObj["Các phương án"]?.split("#")[1] || "",
        phuongAn3:
          rowObj["Phương án 3"] || rowObj["Các phương án"]?.split("#")[2] || "",
        phuongAn4:
          rowObj["Phương án 4"] || rowObj["Các phương án"]?.split("#")[3] || "",
        tenAnh: rowObj["tenAnh"] || "",
        language: rowObj["Ngôn ngữ"] || "vi",
        // Thêm mới: Cột Từ vựng 1-6 và Dịch từ vựng 1-6
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
      };
    });

    const questions = raw.filter(
      (q) => q.monHoc && q.loai && q.chuDe && q.cauHoi && q.dapAn
    );

    console.log("Processed questions:", questions); // Debug: Kiểm tra dữ liệu sau filter

    const colRef = collection(db, collectionName);

    try {
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

      await Promise.all(questions.map((q) => addDoc(colRef, q)));

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
      alert(
        "❌ Có lỗi xảy ra khi import dữ liệu. Kiểm tra Console để biết chi tiết."
      );
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
      <td>${q.dapAn}</td>
      <td>${q.tuVung ? q.tuVung.join("; ") : "Không có"}</td>
      <td>${q.dichTuVung ? q.dichTuVung.join("; ") : "Không có"}</td>
    `;
    previewBody.appendChild(r);
  });
}

window.addEventListener("DOMContentLoaded", loadSelections);
