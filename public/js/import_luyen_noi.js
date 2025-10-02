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
  if (!window.XLSX) await import(XLSX_URL);
}

document
  .getElementById("import_luyen_noi")
  .addEventListener("click", async () => {
    const file = document.getElementById("popupFile").files[0];
    if (!file) return alert("Vui lòng chọn file Excel.");

    await loadXLSX();
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!json.length || !json[0]["Câu hỏi"]) {
          return alert("❌ File Excel thiếu cột 'Câu hỏi'.");
        }

        const collectionName = "selection_luyen_noi_tieng_anh";
        const questions = json
          .map((row, index) => ({
            stt: index + 1,
            monHoc: "Tiếng Anh",
            loai: "Luyện nói",
            chuDe: row["Chủ đề"] || "Unknown",
            cauHoi: row["Câu hỏi"] || "",
            dapAn: row["Đáp án"] || "",
            dichDapAn: row["Dịch đáp án"] || "",
            language: "en",
          }))
          .filter((q) => q.cauHoi && q.dapAn);

        if (!questions.length) return alert("❌ Không có câu hỏi hợp lệ.");

        const colRef = collection(db, collectionName);
        const existingDocs = await getDocs(colRef);
        if (!existingDocs.empty) {
          if (!confirm(`⚠️ Danh sách "${collectionName}" đã tồn tại. Ghi đè?`))
            return;
          await Promise.all(
            existingDocs.docs.map((docSnap) => deleteDoc(docSnap.ref))
          );
        }

        await Promise.all(questions.map((q) => addDoc(colRef, q)));
        await addDoc(collection(db, "selectionMeta"), {
          name: collectionName,
          createdAt: Date.now(),
        });

        alert(`✅ Đã import ${questions.length} câu hỏi luyện nói tiếng Anh.`);
        document.getElementById("popupOverlay").click();
      } catch (err) {
        console.error("❌ Lỗi import:", err);
        alert("❌ Lỗi khi import dữ liệu.");
      }
    };
    reader.readAsArrayBuffer(file);
  });
