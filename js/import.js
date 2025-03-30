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
  document.getElementById("importBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("excelFile");
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

      const questions = json.map((row) => ({
        monHoc: row["Môn học"],
        loai: row["Loại"],
        chuDe: row["Chủ đề"],
        cauHoi: row["Câu trắc nghiệm"] || row["Dịch sang tiếng Việt Câu hỏi"],
        phuongAn1: row["Phương án 1"] || row["Các phương án"]?.split("#")[0],
        phuongAn2: row["Phương án 2"] || row["Các phương án"]?.split("#")[1],
        phuongAn3: row["Phương án 3"] || row["Các phương án"]?.split("#")[2],
        phuongAn4: row["Phương án 4"] || row["Các phương án"]?.split("#")[3],
        dapAn: row["Đáp án đúng"],
        tenAnh: row["tenAnh"] || "",
      }));

      // Xóa toàn bộ trước khi import
      const snapshot = await getDocs(collection(db, "questions"));
      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "questions", docSnap.id))
        )
      );

      // Thêm mới
      await Promise.all(
        questions.map((q) => addDoc(collection(db, "questions"), q))
      );

      alert("✅ Đã lưu lên Firebase! Tổng số câu hỏi: " + questions.length);
      window.location.reload();
    };

    reader.readAsArrayBuffer(file);
  });

  // Nút xóa thủ công
  document
    .getElementById("deleteDataBtn")
    .addEventListener("click", async () => {
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

  // Hiển thị dữ liệu từ Firebase
  const tbody = document.querySelector("#bangDuLieu tbody");
  const soLuongSpan = document.getElementById("soLuongCau");

  getDocs(collection(db, "questions")).then((snapshot) => {
    const questions = snapshot.docs.map((doc) => doc.data());
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
