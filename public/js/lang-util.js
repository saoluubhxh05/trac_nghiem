// lang-util.js

export function langToLocale(lang) {
  return (
    {
      en: "en-US",
      zh: "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR",
      vi: "vi-VN",
    }[lang] || "en-US"
  );
}

export function normalize(text, lang = "en") {
  if (lang === "zh") {
    return text
      .replace(/\s+/g, "") // xoá khoảng trắng
      .replace(/[a-zA-Z0-9.,!?'"“”‘’\-]/g, "") // loại bỏ ký tự Latin, số, dấu câu
      .trim();
  }

  if (lang === "ja" || lang === "ko") {
    return text.trim(); // đơn giản vì không có space hoặc dễ chuẩn hoá
  }

  // Ngôn ngữ có khoảng trắng: tiếng Anh, Việt...
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

export function splitWords(text, lang = "en") {
  if (lang === "zh" || lang === "ja" || lang === "ko") {
    return text.split(""); // từng ký tự
  }
  return text.split(" ");
}

export function compareWords(userText, answer, lang = "en", accumulated = []) {
  const userWords = splitWords(normalize(userText, lang), lang);
  const answerWords = splitWords(normalize(answer, lang), lang);

  let correct = 0;
  const updatedAccumulated = [...accumulated]; // sao chép mảng để không thay đổi trực tiếp

  const revealed = answerWords.map((w, i) => {
    if (updatedAccumulated[i] === w || userWords.includes(w)) {
      updatedAccumulated[i] = w;
      correct++;
      return w;
    }
    return "___";
  });

  const percent = Math.round((correct / answerWords.length) * 100);

  return {
    revealed: revealed.join(" "),
    percent,
    accumulatedText: updatedAccumulated.map((w) => w || "___").join(" "),
    accumulatedArray: updatedAccumulated,
  };
}

export function matchWords(userWords, accumulatedMatched) {
  let correct = 0;
  const matched = accumulatedMatched.map((w, i) => {
    if (w) return w;
    if (userWords.includes(w)) {
      correct++;
      return w;
    }
    return "___";
  });

  const percent = Math.round((correct / matched.length) * 100);
  return {
    matched,
    percent,
  };
}

export function compareChinese(userText, answerText, accumulatedMatched = []) {
  const userChars = normalize(userText, "zh").split("");
  const answerChars = normalize(answerText, "zh").split("");

  const newAccumulated = [...accumulatedMatched];
  let correct = 0;

  const revealed = answerChars.map((c, i) => {
    if (newAccumulated[i] === c || userChars.includes(c)) {
      newAccumulated[i] = c;
      correct++;
      return c;
    }
    return "＿";
  });

  return {
    revealed: revealed.join(""),
    percent: Math.round((correct / answerChars.length) * 100),
    accumulated: newAccumulated.map((c) => c || "＿").join(""),
    accumulatedArray: newAccumulated,
  };
}
