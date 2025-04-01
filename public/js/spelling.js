import { speak } from "./speech-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

let currentIndex = 0;
let readLimit = 3;

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const qContainer = document.getElementById("questionContainer");
const playBtn = document.getElementById("playAudioBtn");
const input = document.getElementById("answerInput");
const submitBtn = document.getElementById("submitBtn");
const result = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");

const counterSpan = document.createElement("span");
counterSpan.id = "readCounter";
counterSpan.style.marginLeft = "10px";
playBtn.after(counterSpan);

// 👉 Thêm khung ảnh cạnh nút nghe
const imgPreview = document.createElement("img");
imgPreview.id = "questionImage";
imgPreview.style.maxWidth = "400px";
imgPreview.style.marginTop = "10px";
imgPreview.style.display = "block";
imgPreview.style.borderRadius = "8px";
playBtn.after(imgPreview);

function updateReadCounter() {
  counterSpan.textContent = `(Còn lại: ${readLimit} lần nghe)`;
  playBtn.disabled = readLimit <= 0;
  playBtn.style.opacity = readLimit <= 0 ? "0.5" : "1";
}

function resetReadCounter() {
  readLimit = 3;
  updateReadCounter();
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'") // chuyển dấu nháy cong thành dấu nháy thẳng
    .replace(/[^a-z0-9'\s]/g, "") // giữ lại ký tự, số, dấu nháy đơn
    .replace(/\s+/g, " ") // chuẩn hóa khoảng trắng
    .trim();
}

function renderAnswerDots(expectedWords, userWords) {
  return expectedWords
    .map((w, i) => (userWords[i] === w ? w : "..."))
    .join(" ");
}

function updateLiveMatch() {
  const expected = questions[currentIndex].dapAn;
  const expectedWords = normalize(expected).split(" ");
  const userWords = normalize(input.value).split(" ");
  const answerDisplay = renderAnswerDots(expectedWords, userWords);

  const match = expectedWords.filter((w, i) => userWords[i] === w).length;
  const percent = Math.round((match / expectedWords.length) * 100);

  result.innerHTML = `
    <p><strong>Đáp án đúng:</strong> ${answerDisplay}</p>
    <p><strong>🎯 Độ khớp:</strong> ${percent}%</p>
  `;

  nextBtn.style.display = percent >= 50 ? "inline-block" : "none";
}

function renderQuestion() {
  input.value = "";
  result.innerHTML = "";
  nextBtn.style.display = "none";

  const q = questions[currentIndex];
  if (q.audio) {
    qContainer.innerHTML = `<audio id="audioPlayer" src="${q.audio}" preload="auto"></audio>`;
  } else {
    // qContainer.innerHTML = `<p><strong>Đọc lại câu sau:</strong> "${q.dapAn}"</p>`;
  }

  // ✅ Hiển thị ảnh nếu có
  if (q.tenAnh) {
    imgPreview.src = `images/${q.tenAnh}`;
    imgPreview.style.display = "block";
  } else {
    imgPreview.style.display = "none";
  }

  resetReadCounter();
}

function playAudio() {
  if (readLimit <= 0) return;

  const audio = document.getElementById("audioPlayer");
  const q = questions[currentIndex];
  if (audio) {
    audio.play();
  } else {
    speak(q.dapAn);
  }

  readLimit--;
  updateReadCounter();
}

playBtn.addEventListener("click", playAudio);
input.addEventListener("input", updateLiveMatch);

submitBtn.addEventListener("click", () => {
  if (!input.value.trim()) {
    alert("Bạn chưa nhập câu trả lời.");
    return;
  }

  updateLiveMatch();
});

nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    qContainer.innerHTML = `<h2>✅ Bạn đã hoàn thành phần luyện chính tả!</h2>`;
   // localStorage.setItem("lastDoneDate", new Date().toISOString());

    input.style.display = "none";
    submitBtn.style.display = "none";
    playBtn.style.display = "none";
    imgPreview.style.display = "none";
    counterSpan.style.display = "none";
    nextBtn.style.display = "none";

    // ✅ Thêm nút chuyển bài tiếp theo
    taoNutBaiTiepTheo(qContainer);
    // ✅ Cập nhật thời gian hoàn thành
    localStorage.setItem("lastDoneDate", new Date().toISOString());
  }
});

renderQuestion();
