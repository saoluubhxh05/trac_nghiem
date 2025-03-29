window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("importBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("excelFile");
    const file = fileInput.files[0];

    if (!file) {
      alert("Vui lòng chọn file Excel.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
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

      localStorage.setItem("questions", JSON.stringify(questions));
      alert("✅ Import thành công! Tổng số câu hỏi: " + questions.length);
      window.location.reload();
    };

    reader.readAsArrayBuffer(file);
  });

  // Hiển thị dữ liệu đã import
  const data = localStorage.getItem("questions");
  if (data) {
    const questions = JSON.parse(data);
    document.getElementById(
      "soLuongCau"
    ).textContent = `Tổng số câu: ${questions.length}`;

    const tbody = document.querySelector("#bangDuLieu tbody");
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
  }

  // Nút xóa dữ liệu
  document.getElementById("deleteDataBtn").addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu đã import?")) {
      localStorage.removeItem("questions");
      window.location.reload();
    }
  });
});
