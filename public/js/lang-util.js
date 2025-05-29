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
  if (lang === "zh" || lang === "ja" || lang === "ko") {
    return text.trim();
  }
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
