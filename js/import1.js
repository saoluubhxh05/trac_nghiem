// import1.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
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

    const table = document.getElementById("previewTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const keys = Object.keys(json[0] || {});
    const headRow = document.createElement("tr");
    keys.forEach((key) => {
      const th = document.createElement("th");
      th.textContent = key;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    json.forEach(async (row) => {
      const docRef = await addDoc(collection(db, "questions"), row);

      const tr = document.createElement("tr");
      keys.forEach((key) => {
        const td = document.createElement("td");
        td.textContent = row[key];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    alert("✅ Import thành công: " + json.length + " dòng");
  };

  reader.readAsArrayBuffer(file);
});
