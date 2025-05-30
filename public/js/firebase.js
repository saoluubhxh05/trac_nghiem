// js/firebase.js
import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvNfpf4KQeJw9fuDkTyXdoDY3LEuUL1fc",
  authDomain: "abcd-9d83a.firebaseapp.com",
  projectId: "abcd-9d83a",
  storageBucket: "abcd-9d83a.appspot.com",
  messagingSenderId: "380338460918",
  appId: "1:380338460918:web:d1b1d7c9bc40471ded34d7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function initFirebaseAuth() {
  window.addEventListener("DOMContentLoaded", () => {
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
}
