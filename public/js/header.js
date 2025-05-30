// js/header.js
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Khởi tạo Firebase nếu chưa có
const firebaseConfig = {
  apiKey: "AIzaSyBvNfpf4KQeJw9fuDkTyXdoDY3LEuUL1fc",
  authDomain: "abcd-9d83a.firebaseapp.com",
  projectId: "abcd-9d83a",
  storageBucket: "abcd-9d83a.appspot.com",
  messagingSenderId: "380338460918",
  appId: "1:380338460918:web:d1b1d7c9bc40471ded34d7",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
  const header = document.createElement("div");
  header.id = "fixedHeader";
  header.innerHTML = `
    <button onclick="location.href='index.html'">🏠 Home</button>
    <div id="loginArea"></div>
  `;
  document.body.prepend(header);

  const style = document.createElement("style");
  style.textContent = `
    #fixedHeader {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: white;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 1000;
    }
    body {
      padding-top: 60px;
    }
  `;
  document.head.appendChild(style);

  const loginArea = document.getElementById("loginArea");
  if (!loginArea) return;

  const loginDiv = document.createElement("div");
  loginDiv.id = "loginWidget";
  loginDiv.innerHTML = `
    <button id="loginBtn">🔐 Đăng nhập</button>
    <div id="userMenu" style="display: none; align-items: center; gap: 8px;">
      <img id="userAvatar" style="width: 36px; height: 36px; border-radius: 50%" />
      <span id="userName" style="font-weight: bold;"></span>
      <button id="logoutBtn">🚪 Thoát</button>
    </div>
  `;
  loginArea.appendChild(loginDiv);

  const loginBtn = document.getElementById("loginBtn");
  const userMenu = document.getElementById("userMenu");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");
  const logoutBtn = document.getElementById("logoutBtn");

  loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
          })
        );
      })
      .catch((error) => {
        alert("Lỗi đăng nhập: " + error.message);
      });
  });

  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      localStorage.removeItem("userInfo");
      location.reload();
    });
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBtn.style.display = "none";
      userMenu.style.display = "flex";
      userName.textContent = user.displayName;
      userAvatar.src = user.photoURL;
    } else {
      loginBtn.style.display = "inline-block";
      userMenu.style.display = "none";
    }
  });
});
