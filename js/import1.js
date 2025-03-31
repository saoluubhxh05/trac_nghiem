// import1.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cấu hình Firebase
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

document.getElementById("importBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("excelFile");
  const status = document.getElementById("status");

  const file = fileInput.files[0];
  if (!file) {
    alert("Vui lòng chọn file Excel!");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    console.log("📄 Dữ liệu Excel đã đọc:", rows);

    if (!rows.length) {
      status.innerText =
        "❌ File Excel không có dữ liệu hoặc sai định dạng cột.";
      return;
    }

    status.innerText = `⏳ Đang import ${rows.length} dòng...`;

    let count = 0;
    for (const row of rows) {
      const docData = {
        monHoc: row["Môn học"],
        loai: row["Loại"],
        chuDe: row["Chủ đề"],
        cauHoi: row["Câu hỏi"],
        dapAn: row["Đáp án đúng"],
        phuongAn1: row["PA1"],
        phuongAn2: row["PA2"],
        phuongAn3: row["PA3"],
        phuongAn4: row["PA4"],
        tenAnh: row["Hình ảnh"],
      };

      console.log(`👉 Dòng ${count + 1}:`, docData);

      try {
        await addDoc(collection(db, "questions"), docData);
        count++;
      } catch (err) {
        console.error(`❌ Lỗi tại dòng ${count + 1}:`, err);
      }
    }

    status.innerText = `✅ Đã import ${count} / ${rows.length} dòng thành công vào Firestore.`;
  };

  reader.readAsArrayBuffer(file);
});
