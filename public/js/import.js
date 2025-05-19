// js/import.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
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

document.addEventListener("DOMContentLoaded", () => {
  const importBtn = document.getElementById("importBtn");
  const deleteBtn = document.getElementById("deleteDataBtn");
  const fileInput = document.getElementById("excelFile");
  const tbody = document.querySelector("#bangDuLieu tbody");
  const soLuongSpan = document.getElementById("soLuongCau");

  importBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Vui lòng chọn file Excel.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Thêm chỉ số dòng (STT) + lọc dòng đủ điều kiện
      const raw = json.map((row, index) => ({
        stt: index + 1, // ✅ Gắn STT theo thứ tự dòng
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
      }));

      const questions = raw.filter(
        (q) => q.monHoc && q.loai && q.chuDe && q.cauHoi && q.dapAn
      );

      console.log("📤 Dữ liệu import:", questions);

      // Xóa dữ liệu cũ
      const snapshot = await getDocs(collection(db, "questions"));
      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "questions", docSnap.id))
        )
      );

      // Gửi lên Firestore
      const questionsCollection = collection(db, "questions");
      console.log("📤 Đang ghi lên Firestore:", questions);

      await Promise.all(
        questions.map(async (q, index) => {
          try {
            await addDoc(questionsCollection, q);
          } catch (err) {
            console.error("❌ Lỗi tại dòng", index + 1, err);
          }
        })
      );

      alert("✅ Import thành công! Tổng số câu hỏi: " + questions.length);
      window.location.reload();
    };

    reader.readAsArrayBuffer(file);
  });

  // Xóa dữ liệu thủ công
  deleteBtn.addEventListener("click", async () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu đã import?")) {
      const snapshot = await getDocs(collection(db, "questions"));
      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "questions", docSnap.id))
        )
      );
      alert("✅ Đã xóa toàn bộ dữ liệu trên Firebase.");
      window.location.reload();
    }
  });

  // Hiển thị dữ liệu đã lưu (sắp xếp theo stt)
  getDocs(collection(db, "questions")).then((snapshot) => {
    const questions = snapshot.docs.map((doc) => doc.data());
    questions.sort((a, b) => (a.stt || 0) - (b.stt || 0)); // ✅ Sắp xếp theo STT

    soLuongSpan.textContent = `Tổng số câu: ${questions.length}`;
    tbody.innerHTML = "";

    questions.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.monHoc}</td>
        <td>${item.loai}</td>
        <td>${item.chuDe}</td>
        <td>${item.cauHoi}</td>
        <td>${item.dapAn}</td>
        <td>${item.phuongAn1}</td>
        <td>${item.phuongAn2}</td>
        <td>${item.phuongAn3}</td>
        <td>${item.phuongAn4}</td>
        <td>${item.tenAnh}</td>
      `;
      tbody.appendChild(row);
    });
  });
});
