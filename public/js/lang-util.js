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
export function compareWords(userText, answer, lang = "en") {
  const userWords = splitWords(normalize(userText, lang), lang);
  const answerWords = splitWords(normalize(answer, lang), lang);
  let correct = 0;

  const revealed = answerWords.map((w, i) => {
    if (userWords.includes(w)) {
      correct++;
      return w;
    }
    return "___";
  });

  const percent = Math.round((correct / answerWords.length) * 100);
  return {
    revealed: revealed.join(" "),
    percent,
    accumulated: revealed.join(" "),
    answerWords,
  };
}
export function matchWords(userWords, answerWords) {
  let correct = 0;
  const matched = answerWords.map((w, i) => {
    if (userWords.includes(w)) {
      correct++;
      return w;
    }
    return "___";
  });

  return {
    matched,
    percent: Math.round((correct / answerWords.length) * 100),
  };
}
