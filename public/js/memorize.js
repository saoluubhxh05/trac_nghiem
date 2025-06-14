import { speak } from "./speech-util.js";
import { renderQuestionImage } from "./image-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
} from "./lang-util.js";

import { taoNutBaiTiepTheo } from "./navigation.js";

const language = localStorage.getItem("language") || "en";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("memorizeContainer");
let currentIndex = 0;
let step = 0;
let readLimit = 3;
let recognition = null;
let isListening = false;
let finalTranscript = "";
let accumulatedMatched = [];

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderStep() {
  container.innerHTML = "";
  if (step === 0) renderFillBlankStep();
  else renderMemorizeStep();
}

function renderFillBlankStep() {
  const q = questions[currentIndex];
  const words = splitWords(q.dapAn, q.language);
  const hideCount = Math.max(1, Math.floor(words.length / 3));
  const hiddenIndexes = shuffle([...Array(words.length).keys()]).slice(
    0,
    hideCount
  );
  const blanks = {};
  let selectedWord = null;

  const sentenceHTML = words
    .map((word, i) => {
      if (hiddenIndexes.includes(i)) {
        const id = `blank-${i}`;
        blanks[id] = word;
        return `<span id="${id}" class="blank" style="display:inline-block;min-width:60px;border-bottom:2px dashed #888;cursor:pointer;">_____</span>`;
      }
      return word;
    })
    .join(" ");

  const choices = shuffle(hiddenIndexes.map((i) => words[i]));

  container.innerHTML = `
    <h2>📝 Điền vào chỗ trống</h2>
    <p style="line-height:1.8">${sentenceHTML}</p>
    <div id="choiceArea" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:12px;padding:12px;border:1px dashed #aaa;border-radius:8px;">
      ${choices
        .map(
          (w) => `
        <span class="choice" style="padding:8px 14px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:16px;background:#f5f5f5;">${w}</span>
      `
        )
        .join("")}
    </div>
    <div id="revealAnswer" style="margin-top:20px;font-size:18px;line-height:1.6;color:#444;"></div>
  `;
  renderQuestionImage(q.tenAnh, container);

  function updateRevealAnswer() {
    const revealed = words.map((word, i) => {
      if (!hiddenIndexes.includes(i)) return word;
      const el = document.getElementById(`blank-${i}`);
      const filled = el?.getAttribute("data-word") || "";
      return normalize(filled, q.language) === normalize(word, q.language)
        ? word
        : "_____";
    });
    document.getElementById("revealAnswer").innerHTML =
      `<strong>Đáp án đúng dần:</strong> ` + revealed.join(" ");
  }

  document.querySelectorAll(".choice").forEach((choice) => {
    choice.onclick = () => {
      selectedWord = choice.textContent;
      document
        .querySelectorAll(".choice")
        .forEach((c) => (c.style.border = "1px solid #ccc"));
      choice.style.border = "2px solid blue";
    };
  });

  Object.keys(blanks).forEach((id) => {
    const el = document.getElementById(id);
    el.onclick = () => {
      if (!selectedWord && el.dataset.word) {
        const word = el.dataset.word;
        el.textContent = "_____";
        el.style.color = "black";
        el.removeAttribute("data-word");

        const choiceClone = document.createElement("span");
        choiceClone.className = "choice";
        choiceClone.textContent = word;
        choiceClone.style =
          "padding:8px 14px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:16px;background:#f5f5f5;margin:2px;";
        choiceClone.onclick = () => {
          selectedWord = word;
          document
            .querySelectorAll(".choice")
            .forEach((c) => (c.style.border = "1px solid #ccc"));
          choiceClone.style.border = "2px solid blue";
        };
        document.getElementById("choiceArea").appendChild(choiceClone);
        updateRevealAnswer();
        return;
      }

      if (!selectedWord) return;

      el.textContent = selectedWord;
      el.setAttribute("data-word", selectedWord);
      el.style.pointerEvents = "auto";

      const isCorrect =
        normalize(selectedWord, q.language) ===
        normalize(blanks[id], q.language);
      el.style.color = isCorrect ? "green" : "red";

      document.querySelectorAll(".choice").forEach((c) => {
        if (c.textContent === selectedWord) c.remove();
      });

      selectedWord = null;
      updateRevealAnswer();

      const remaining = Object.keys(blanks).filter((id) => {
        const el = document.getElementById(id);
        const current = el.getAttribute("data-word") || "";
        return (
          normalize(current, q.language) !== normalize(blanks[id], q.language)
        );
      });

      if (remaining.length === 0 && !document.getElementById("nextBtn")) {
        const btn = document.createElement("button");
        btn.id = "nextBtn";
        btn.textContent = "✅ Tiếp tục luyện dịch";
        btn.style.marginTop = "20px";
        btn.onclick = () => {
          step++;
          renderStep();
        };
        container.appendChild(btn);
      }
    };
  });

  updateRevealAnswer(); // Gọi lần đầu
}

function renderMemorizeStep() {
  const q = questions[currentIndex];
  if (
    !accumulatedMatched.length ||
    accumulatedMatched.length !== splitWords(q.dapAn, q.language).length
  ) {
    accumulatedMatched = new Array(splitWords(q.dapAn, q.language).length).fill(
      ""
    );
  }
  readLimit = 3;
  let hidden = false;

  container.innerHTML = `
    <h2>📖 Luyện dịch</h2>
    <p id="sentence" style="font-size:20px;line-height:1.6;white-space:pre-line">${q.dapAn.replace(
      /\|/g,
      "\n"
    )}</p>

    <button id="readBtn">🔊 Đọc lại (${readLimit} lần)</button>
    <button id="hideBtn">🙈 Ẩn câu để bắt đầu kiểm tra</button>
    <button id="speakBtn" style="display:none">🎙️ Bắt đầu nói</button>
    <div id="micStatus"></div>
    <div id="result"></div>
  `;
  renderQuestionImage(q.tenAnh, container);

  document.getElementById("readBtn").onclick = () => {
    if (readLimit > 0) {
      speak(q.dapAn, q.language);
      readLimit--;
      document.getElementById(
        "readBtn"
      ).textContent = `🔊 Đọc lại (${readLimit} lần)`;
    }
  };

  document.getElementById("hideBtn").onclick = () => {
    hidden = true;
    document.getElementById("sentence").textContent =
      "🙈 Câu đã được ẩn, hãy đọc lại!";
    document.getElementById("hideBtn").style.display = "none";
    document.getElementById("speakBtn").style.display = "inline-block";
  };

  document.getElementById("speakBtn").onclick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = langToLocale(q.language);
      recognition.interimResults = true;
    }

    if (!isListening) {
      finalTranscript = "";
      isListening = true;
      recognition.start();
      document.getElementById("micStatus").textContent = "🎙️ Đang nghe...";
      speakBtn.textContent = "⏳ Đang ghi...";

      recognition.onresult = (event) => {
        const r = event.results[event.results.length - 1];
        if (r.isFinal) finalTranscript = r[0].transcript.trim();
      };

      recognition.onerror = (e) => {
        document.getElementById("micStatus").textContent =
          "❌ Lỗi ghi âm: " + e.error;
        isListening = false;
        speakBtn.textContent = "🎙️ Bắt đầu nói";
      };
    } else {
      recognition.stop();
      isListening = false;
      speakBtn.textContent = "🎙️ Bắt đầu nói";
      document.getElementById("micStatus").textContent = "";

      setTimeout(() => {
        if (finalTranscript.trim()) {
          const result = compareWords(
            finalTranscript,
            q.dapAn,
            q.language,
            accumulatedMatched
          );
          accumulatedMatched = result.accumulatedArray;

          const accumulatedLine = result.accumulated
            ? `<p><strong>Đáp án tích lũy:</strong> ${result.accumulated}</p>`
            : "";

          document.getElementById("result").innerHTML = `
            <p><strong>Bạn nói:</strong> "${finalTranscript}"</p>
            <p><strong>Đáp án:</strong> ${result.revealed}</p>
            <p><strong>💯 Độ khớp:</strong> ${result.percent}%</p>
            ${accumulatedLine}
          `;

          if (result.percent >= 70) {
            const nextBtn = document.createElement("button");
            nextBtn.textContent = "✅ Tiếp tục câu tiếp theo";
            nextBtn.style.marginTop = "20px";
            nextBtn.onclick = () => {
              currentIndex++;
              step = 0;
              if (currentIndex < questions.length) {
                renderStep();
              } else {
                container.innerHTML = `<h2>✅ Bạn đã hoàn thành bài học thuộc lòng!</h2>`;
                taoNutBaiTiepTheo(container);
              }
            };
            container.appendChild(nextBtn);
          }
        } else {
          document.getElementById("micStatus").textContent =
            "⚠️ Không nhận được nội dung nào!";
        }
      }, 300);
    }
  };
}

renderStep();
