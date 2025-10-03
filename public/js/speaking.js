import { renderQuestionImage } from "./image-util.js";
import { speak } from "./speech-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentIndex = 0;
  const questions = JSON.parse(
    localStorage.getItem("selectedQuestions") || "[]"
  );

  if (!questions.length) {
    alert("Không có dữ liệu. Vui lòng chọn bài trước.");
    window.location.href = "select-quiz-2.html";
    return;
  }

  const questionContainer = document.getElementById("questionContainer");
  const speakBtn = document.getElementById("speakBtn");
  const micStatus = document.getElementById("micStatus");
  const result = document.getElementById("result");
  const nextBtn = document.getElementById("nextBtn");
  const speakAgainBtn = document.getElementById("speakAgainBtn");
  const readCounter = document.getElementById("readCounter");
  const hintToggle = document.getElementById("hintToggle");

  if (!speakBtn || !questionContainer) {
    console.error("❌ Lỗi: Không tìm thấy elements cần thiết.");
    return;
  }

  let recognition;
  let isListening = false;
  let finalTranscript = "";
  let accumulatedMatched = [];
  let readLimit = 3;
  let startTime = 0;
  let isHintVisible = true; // State cho toggle hint
  let previousPercent = 0; // Lưu % từ câu trước để dynamic hint

  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9'\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function updateReadCounter() {
    readCounter.textContent = `Còn lại: ${readLimit} lần`;
    speakAgainBtn.disabled = readLimit === 0;
    speakAgainBtn.style.opacity = readLimit === 0 ? "0.5" : "1";
  }

  function resetReadCounter() {
    readLimit = 3;
    updateReadCounter();
  }

  // Thêm: Toggle hint visibility
  function toggleHint() {
    isHintVisible = !isHintVisible;
    const hintEl = questionContainer.querySelector(".hint");
    if (hintEl) {
      hintEl.style.display = isHintVisible ? "block" : "none";
    }
    hintToggle.textContent = isHintVisible ? "👁️ Ẩn gợi ý" : "👁️ Hiện gợi ý";
  }

  function renderQuestion() {
    const full = questions[currentIndex].dapAn.trim();
    let hintText = full.split(" ").slice(0, 2).join(" ") + "..."; // Hint cơ bản

    // Dynamic hint dựa trên % câu trước
    if (previousPercent < 50) {
      hintText = full.split(" ").slice(0, 3).join(" ") + "..."; // Hiện 3 từ nếu % thấp
    } else if (previousPercent >= 50) {
      hintText = full; // Hiện full nhưng mờ nếu % cao
      const hintEl = document.createElement("div");
      hintEl.className = "hint";
      hintEl.innerHTML = `<span style="opacity: 0.6;">💡 Gợi ý đầy đủ: "${hintText}"</span>`;
      questionContainer.innerHTML = "";
      questionContainer.appendChild(hintEl);
      renderQuestionImage(questions[currentIndex].tenAnh, questionContainer);
      return; // Skip phần dưới nếu dynamic
    }

    questionContainer.innerHTML = `<div class="hint">💡 Gợi ý: "${hintText}"</div>`;

    const imageName = questions[currentIndex].tenAnh;
    renderQuestionImage(imageName, questionContainer);

    result.innerHTML = "";
    nextBtn.style.display = "none";
    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.5";
    micStatus.textContent = "";
    speakBtn.textContent = "🎙️ Bắt đầu nói";
    isListening = false;
    finalTranscript = "";
    accumulatedMatched = [];
    resetReadCounter();

    // Toggle hint ban đầu
    if (!isHintVisible) toggleHint();
  }

  function startRecognition() {
    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    startTime = performance.now();

    finalTranscript = "";

    recognition.onresult = function (event) {
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.isFinal) {
        finalTranscript = latestResult[0].transcript.trim();
      }
    };

    recognition.onerror = function () {
      micStatus.textContent = "❌ Lỗi ghi âm. Vui lòng thử lại.";
      speakBtn.textContent = "🎙️ Bắt đầu nói";
      isListening = false;
    };

    recognition.onend = function () {
      micStatus.textContent = "⏳ Đang xử lý...";

      const transcript = finalTranscript.trim();
      const expected = questions[currentIndex].dapAn.trim();
      const spokenWords = normalize(transcript).split(" ");
      const targetWords = normalize(expected).split(" ");

      const ans1 = targetWords
        .map((w, i) => (spokenWords[i] === w ? w : "..."))
        .join(" ");

      const updatedAns2 = targetWords.map((w, i) => {
        if (accumulatedMatched[i] === w) return w;
        if (spokenWords.includes(w)) {
          accumulatedMatched[i] = w;
          return w;
        }
        return `<input data-index="${i}" class="input-word" style="width:auto;min-width:40px;text-align:center;" />`;
      });

      const matchCount = accumulatedMatched.filter(
        (w) => w === w && w !== undefined
      ).length;
      let percent = Math.round((matchCount / targetWords.length) * 100);
      previousPercent = percent; // Lưu cho dynamic hint câu sau

      const duration = ((performance.now() - startTime) / 1000).toFixed(1);
      const fluencyScore =
        duration > 10 ? "Tốt (fluency cao)" : "Cần nói dài hơn";

      result.innerHTML = `
        <p><strong>Bạn đã nói:</strong> "${transcript}"</p>
        <p><strong>Đáp án 1 (theo thứ tự):</strong> ${ans1}</p>
        <p><strong>Đáp án 2 (không theo thứ tự, tích lũy):</strong> ${updatedAns2.join(
          " "
        )}</p>
        <p id="percentMatch"><strong>💯 Độ khớp:</strong> ${percent}%</p>
        <p><strong>Fluency:</strong> ${duration}s - ${fluencyScore}</p>
      `;

      nextBtn.style.display = "inline-block";
      nextBtn.disabled = percent < 50;
      nextBtn.style.opacity = percent >= 50 ? "1" : "0.5";

      document.querySelectorAll(".input-word").forEach((input) => {
        input.addEventListener("input", () => {
          document.querySelectorAll(".input-word").forEach((inp) => {
            const idx = parseInt(inp.dataset.index);
            const val = normalize(inp.value);
            if (val === normalize(targetWords[idx])) {
              accumulatedMatched[idx] = targetWords[idx];
            }
          });

          const matchNow = accumulatedMatched.filter(
            (w, i) => w === targetWords[i]
          ).length;
          const percent = Math.round((matchNow / targetWords.length) * 100);
          document.getElementById(
            "percentMatch"
          ).innerHTML = `<strong>💯 Độ khớp:</strong> ${percent}%`;

          nextBtn.disabled = percent < 50;
          nextBtn.style.opacity = percent >= 50 ? "1" : "0.5";
        });
      });

      speakBtn.textContent = "🎙️ Bắt đầu nói";
      micStatus.textContent = "";
      isListening = false;
    };

    recognition.start();
    micStatus.textContent = "🎙️ Đang nghe...";
    speakBtn.textContent = "⏳ Chờ";
    isListening = true;
  }

  // Event listeners cho buttons
  speakBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      startRecognition();
    }
  });

  speakAgainBtn.addEventListener("click", () => {
    if (readLimit > 0) {
      const textToSpeak = questions[currentIndex].dapAn;
      speak(textToSpeak);
      readLimit--;
      updateReadCounter();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (nextBtn.disabled) return;
    currentIndex++;
    if (currentIndex < questions.length) {
      renderQuestion();
    } else {
      questionContainer.innerHTML = `<h2>✅ Hoàn thành bài luyện nói!</h2>`;

      speakBtn.style.display = "none";
      nextBtn.style.display = "none";
      speakAgainBtn.style.display = "none";
      readCounter.style.display = "none";
      hintToggle.style.display = "none"; // Ẩn toggle khi hoàn thành

      taoNutBaiTiepTheo(questionContainer);
      localStorage.setItem("lastDoneDate", new Date().toISOString());
    }
  });

  // Thêm: Event cho toggle hint
  hintToggle.addEventListener("click", toggleHint);

  // Thêm: 4 Hotkeys
  document.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
      case " ":
        event.preventDefault(); // Ngăn scroll
        speakBtn.click(); // Toggle ghi âm
        break;
      case "r":
        event.preventDefault();
        speakAgainBtn.click(); // Replay
        break;
      case "n":
        event.preventDefault();
        if (!nextBtn.disabled) nextBtn.click(); // Next
        break;
      case "h":
        event.preventDefault();
        hintToggle.click(); // Toggle hint
        break;
    }
  });

  renderQuestion();
});
