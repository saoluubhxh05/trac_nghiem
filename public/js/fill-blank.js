import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("allQuestions");
let selectedWord = null;

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function createQuestionBlock(question, index) {
  const answerWords = question.dapAn.trim().split(" ");
  const hideCount = Math.max(1, Math.floor(answerWords.length / 3));
  const hiddenIndexes = shuffle([...Array(answerWords.length).keys()]).slice(
    0,
    hideCount
  );
  const blanks = {};

  const sentenceHTML = answerWords
    .map((word, i) => {
      if (hiddenIndexes.includes(i)) {
        const id = `q${index}-blank-${i}`;
        blanks[id] = word;
        return `<span class="blank" id="${id}">_____</span>`;
      }
      return word;
    })
    .join(" ");

  const allHiddenWords = hiddenIndexes.map((i) => answerWords[i]);
  const shuffledChoices = shuffle([...allHiddenWords]);

  const block = document.createElement("div");
  block.className = "question-block";
  block.innerHTML = `
    <p><strong>Câu ${index + 1}:</strong> ${sentenceHTML}</p>
    <div class="word-bank" id="bank-${index}">
      ${shuffledChoices.map((w) => `<span class="choice">${w}</span>`).join("")}
    </div>
  `;

  container.appendChild(block);

  // Xử lý chọn từ
  const choices = block.querySelectorAll(".choice");
  choices.forEach((choice) => {
    choice.onclick = () => {
      selectedWord = choice.textContent;
      choices.forEach((c) => (c.style.border = "1px solid #999"));
      choice.style.border = "2px solid blue";
    };
  });

  Object.keys(blanks).forEach((blankId) => {
    const blankEl = document.getElementById(blankId);
    blankEl.onclick = () => {
      if (!selectedWord) return;
      blankEl.textContent = selectedWord;

      const correct = selectedWord === blanks[blankId];
      blankEl.classList.add(correct ? "correct" : "wrong");
      blankEl.classList.remove(correct ? "wrong" : "correct");
      blankEl.style.pointerEvents = "none";

      // Ẩn từ đã dùng
      choices.forEach((c) => {
        if (c.textContent === selectedWord) c.remove();
      });

      selectedWord = null;
    };
  });
}

questions.forEach((q, idx) => createQuestionBlock(q, idx));

// Gợi ý: có thể thêm nút “Hoàn thành” nếu cần thống kê đúng/sai
