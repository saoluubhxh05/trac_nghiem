import {
  db,
  auth,
  provider,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
} from "./firebase.js";

let currentUser = null;

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    const userName = user.displayName || user.email;
    document.getElementById("user-name").textContent = `👤 ${userName}`;
  } else {
    signInWithPopup(auth, provider)
      .then((result) => {
        currentUser = result.user;
        const userName = currentUser.displayName || currentUser.email;
        document.getElementById("user-name").textContent = `👤 ${userName}`;
      })
      .catch((error) => {
        alert("Lỗi đăng nhập Google");
        console.error(error);
      });
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Đã đăng xuất");
    window.location.reload();
  });
});

// Hàm lưu câu hỏi vào Firestore
async function luuCauHoiVaoFirebase(cauHoi) {
  if (!currentUser) return;
  await addDoc(collection(db, "cauHoi"), {
    ...cauHoi,
    uid: currentUser.uid,
  });
}

// Nhập Excel và lưu dữ liệu
document.getElementById("importBtn").addEventListener("click", async () => {
  const file = document.getElementById("excelFile").files[0];
  if (!file) return alert("Vui lòng chọn file Excel");

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    let index = 1;

    for (let row of rows) {
      const cauHoi = {
        monHoc: row["Môn học"],
        loai: row["Loại"],
        chuDe: row["Chủ đề"],
        cauHoi: row["Câu hỏi"],
        dapAn: row["Đáp án đúng"],
        pa1: row["PA1"],
        pa2: row["PA2"],
        pa3: row["PA3"],
        pa4: row["PA4"],
        hinhAnh: row["Hình ảnh"] || "",
      };
      await luuCauHoiVaoFirebase(cauHoi);

      // Hiển thị trên bảng
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index++}</td>
        <td>${cauHoi.monHoc}</td>
        <td>${cauHoi.loai}</td>
        <td>${cauHoi.chuDe}</td>
        <td>${cauHoi.cauHoi}</td>
        <td>${cauHoi.dapAn}</td>
        <td>${cauHoi.pa1}</td>
        <td>${cauHoi.pa2}</td>
        <td>${cauHoi.pa3}</td>
        <td>${cauHoi.pa4}</td>
        <td>${cauHoi.hinhAnh}</td>
      `;
      document.querySelector("#bangDuLieu tbody").appendChild(tr);
    }

    alert("✅ Import và lưu Firebase thành công!");
  };

  reader.readAsArrayBuffer(file);
});

// XÓA DỮ LIỆU FIREBASE CỦA NGƯỜI DÙNG
document.getElementById("deleteDataBtn").addEventListener("click", async () => {
  if (!currentUser) return alert("Bạn cần đăng nhập trước");
  const confirmDelete = confirm(
    "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu của bạn?"
  );
  if (!confirmDelete) return;

  const cauHoiRef = collection(db, "cauHoi");
  const q = query(cauHoiRef, where("uid", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map((docu) =>
    deleteDoc(doc(db, "cauHoi", docu.id))
  );
  await Promise.all(promises);

  alert("✅ Đã xóa dữ liệu của bạn!");
  document.querySelector("#bangDuLieu tbody").innerHTML = "";
});
