import { speak } from "./speech-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  const questions = JSON.parse(
    localStorage.getItem("selectedQuestions") || "[]"
  );
  const mode = localStorage.getItem("tuvungMode") || "hocmoi";
  if (!questions.length) {
    alert("Không có dữ liệu từ vựng. Vui lòng chọn bài trước.");
    window.location.href = "select-quiz-2.html";
    return;
  }

  const container = document.getElementById("hoctuvungContainer");
  const nextBtn = document.getElementById("nextBtn");
  let recognition;
  let isListening = false;
  let allWords = []; // Flatten từ vựng từ questions
  let wordResults = {}; // Lưu % khớp mỗi từ

  // Flatten từ vựng từ questions (1-6)
  questions.forEach((q) => {
    for (let i = 1; i <= 6; i++) {
      const tuVung = q[`tuVung${i}`];
      const dichTuVung = q[`dichTuVung${i}`];
      if (tuVung) {
        allWords.push({ tuVung, dichTuVung });
        wordResults[tuVung] = 0; // Init 0%
      }
    }
  });

  if (!allWords.length) {
    container.innerHTML = "<p>Không có từ vựng trong dữ liệu chọn.</p>";
    return;
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9'\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function checkCompletion() {
    const allPassed = allWords.every((w) => wordResults[w.tuVung] >= 50);
    nextBtn.style.display = allPassed ? "block" : "none";
  }

  function startRecognition(onResult) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói!");
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    recognition.onerror = () => alert("❌ Lỗi nhận diện giọng nói.");
  }

  function renderHocMoi() {
    container.innerHTML = "<h2>Học Mới</h2>";
    allWords.forEach((w) => {
      const block = document.createElement("div");
      block.className = "word-block";
      block.innerHTML = `
        <strong>Từ: ${w.tuVung}</strong> - Dịch: ${w.dichTuVung}
        <button class="docBtn">🔊 Đọc</button>
        <button class="laplaiBtn">🎙️ Lặp lại</button>
        <div class="result"></div>
      `;
      const docBtn = block.querySelector(".docBtn");
      docBtn.onclick = () => speak(w.tuVung);

      const laplaiBtn = block.querySelector(".laplaiBtn");
      const resultDiv = block.querySelector(".result");
      laplaiBtn.onclick = () => {
        if (!isListening) {
          startRecognition((transcript) => {
            resultDiv.innerHTML = `Bạn nói: ${transcript}`;
          });
          recognition.start();
          isListening = true;
          laplaiBtn.textContent = "⏳ Đang ghi...";
        } else {
          recognition.stop();
          isListening = false;
          laplaiBtn.textContent = "🎙️ Lặp lại";
          const percent =
            normalize(finalTranscript) === normalize(w.tuVung) ? 100 : 0; // So sánh đơn giản cho từ đơn
          wordResults[w.tuVung] = percent;
          resultDiv.innerHTML += ` 💯 Độ khớp: ${percent}%`;
          checkCompletion();
        }
      };

      container.appendChild(block);
    });
  }

  function renderOnLai() {
    container.innerHTML = "<h2>Ôn Lại</h2>";
    allWords.forEach((w) => {
      const block = document.createElement("div");
      block.className = "word-block";
      // Hint 3 chữ ngẫu nhiên
      const letters = w.tuVung.split("");
      const randomIndices = [...Array(letters.length).keys()]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const hintWord = letters
        .map((l, i) => (randomIndices.includes(i) ? l : "_"))
        .join("");
      block.innerHTML = `
        <strong>Dịch: ${w.dichTuVung}</strong> - Từ: ${hintWord}
        <button class="onlaiBtn">🎙️ Nói để điền</button>
        <div class="result"></div>
      `;
      const onlaiBtn = block.querySelector(".onlaiBtn");
      const resultDiv = block.querySelector(".result");
      onlaiBtn.onclick = () => {
        if (!isListening) {
          startRecognition((transcript) => {
            resultDiv.innerHTML = `Bạn nói: ${transcript}`;
          });
          recognition.start();
          isListening = true;
          onlaiBtn.textContent = "⏳ Đang ghi...";
        } else {
          recognition.stop();
          isListening = false;
          onlaiBtn.textContent = "🎙️ Nói để điền";
          const percent =
            normalize(finalTranscript) === normalize(w.tuVung) ? 100 : 0;
          wordResults[w.tuVung] = percent;
          resultDiv.innerHTML += ` 💯 Độ khớp: ${percent}% (Từ đúng: ${w.tuVung})`;
          checkCompletion();
        }
      };

      container.appendChild(block);
    });
  }

  if (mode === "hocmoi") {
    renderHocMoi();
  } else {
    renderOnLai();
  }

  nextBtn.onclick = () => {
    container.innerHTML = `<h2>🎉 Hoàn thành học từ vựng!</h2>`;
    taoNutBaiTiepTheo(container);
  };
});
