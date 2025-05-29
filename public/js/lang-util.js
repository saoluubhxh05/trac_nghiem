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
      .normalize("NFD") // chuẩn hoá Unicode (để tách dấu Latin)
      .replace(/\s+/g, "") // xoá khoảng trắng
      .replace(/\p{Script=Latin}/gu, "") // loại bỏ mọi ký tự Latin (bao gồm cả có dấu, phiên âm pinyin)
      .replace(/[0-9.,!?'"“”‘’\-]/g, "") // loại bỏ số & dấu câu
      .trim();
  }

  if (lang === "ja" || lang === "ko") {
    return text.trim(); // Giữ nguyên vì ít lỗi phát âm
  }

  // Với ngôn ngữ có dấu cách (en, vi...)
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

export function splitWords(text, lang = "en") {
  if (lang === "zh" || lang === "ja" || lang === "ko") {
    return text.split(""); // Từng ký tự
  }
  return text.split(" ");
}

export function compareWords(userText, answer, lang = "en", accumulated = []) {
  const userWords = splitWords(normalize(userText, lang), lang);
  const answerWords = splitWords(normalize(answer, lang), lang);

  if (
    !Array.isArray(accumulated) ||
    accumulated.length !== answerWords.length
  ) {
    accumulated = new Array(answerWords.length).fill("");
  }

  let correct = 0;
  const revealed = answerWords.map((w, i) => {
    if (accumulated[i] === w || userWords.includes(w)) {
      accumulated[i] = w;
      correct++;
      return w;
    }
    return lang === "zh" ? "＿" : "___";
  });

  const percent = Math.round((correct / answerWords.length) * 100);
  return {
    revealed: revealed.join(lang === "zh" ? "" : " "),
    percent,
    accumulated: accumulated
      .map((w) => w || (lang === "zh" ? "＿" : "___"))
      .join(lang === "zh" ? "" : " "),
    accumulatedArray: accumulated,
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

  if (
    !Array.isArray(accumulatedMatched) ||
    accumulatedMatched.length !== answerChars.length
  ) {
    accumulatedMatched = new Array(answerChars.length).fill("");
  }

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
