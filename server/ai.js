// ===============================
// 教学级离线智能评价引擎
// ===============================

function getLevelComment(acc) {
  if (acc >= 95) {
    return {
      level: "优秀",
      text: "🎉 和弦识别非常熟练，音乐感良好。",
      tempo: "♩=90–110",
    };
  }

  if (acc >= 85) {
    return {
      level: "良好",
      text: "👍 整体稳定，个别和弦需加强。",
      tempo: "♩=80–100",
    };
  }

  if (acc >= 70) {
    return {
      level: "中等",
      text: "📚 基础已具备，建议放慢巩固。",
      tempo: "♩=60–80",
    };
  }

  if (acc >= 50) {
    return {
      level: "需加强",
      text: "💡 和弦结构还不够稳定。",
      tempo: "♩=50–60",
    };
  }

  return {
    level: "基础阶段",
    text: "🌱 建议先熟悉和弦构成再提速。",
    tempo: "♩=40–50",
  };
}

// ===== 常错和弦 → 练习建议 =====
function getChordAdvice(weakChord) {
  const map = {
    maj7: {
      focus: "大七和弦色彩",
      tips: [
        "分解弹奏 1–3–5–7",
        "重点听大七度的紧张感",
        "尝试不同转位练习",
      ],
    },
    m7: {
      focus: "小七和弦结构",
      tips: [
        "先练小三和弦再加七音",
        "注意小三度音程",
        "用慢速分解练习",
      ],
    },
    "7": {
      focus: "属七张力",
      tips: [
        "感受三全音（3和b7）",
        "练习向主和弦解决",
        "多做 V–I 连接",
      ],
    },
    m7b5: {
      focus: "半减七结构",
      tips: [
        "单独练习减五度",
        "分解和弦慢练",
        "与小七和弦对比听辨",
      ],
    },
  };

  return (
    map[weakChord] || {
      focus: "和弦稳定性",
      tips: ["建议慢速分解练习", "多做转位训练", "加强听辨"],
    }
  );
}

// ===============================
// ⭐ 主函数（服务器调用这个）
// ===============================
function generateStudentFeedback(stats) {
  const acc = stats.accuracy || 0;
  const weakChord = stats.weakChord || "maj7";

  const levelInfo = getLevelComment(acc);
  const advice = getChordAdvice(weakChord);

  // 生成练习清单
  const practiceList = advice.tips
    .map((t) => `• ${t}`)
    .join("\n");

  return `
🤖 学习评价：${levelInfo.text}

📊 当前水平：${levelInfo.level}
🎯 主要弱项：${advice.focus}

📚 练习建议：
${practiceList}

⏱ 推荐练习速度：${levelInfo.tempo}
`.trim();
}

module.exports = { generateStudentFeedback };