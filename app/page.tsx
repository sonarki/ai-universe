"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Lang = "en" | "ko";
type Section = "explore" | "learn" | "timeline" | "careers" | "resources";

// 답변 텍스트의 인라인 마크다운(링크·굵게·코드)을 React 요소로 변환
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] && match[2]) nodes.push(<a key={`${keyPrefix}-${index}`} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>);
    else if (match[3]) nodes.push(<b key={`${keyPrefix}-${index}`}>{match[3]}</b>);
    else if (match[4]) nodes.push(<code key={`${keyPrefix}-${index}`}>{match[4]}</code>);
    last = match.index + match[0].length;
    index++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// AI 답변의 마크다운(제목·표·목록·문단)을 안전하게 렌더링 (HTML 삽입 없음)
function MarkdownAnswer({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  let key = 0;
  const isHeading = (s: string) => /^#{1,4}\s/.test(s);
  const isTableRow = (s: string) => s.startsWith("|");
  const isListItem = (s: string) => /^[-*•]\s/.test(s) || /^\d+[.)]\s/.test(s);
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (isHeading(line)) {
      blocks.push(<h3 key={key++}>{renderInline(line.replace(/^#{1,4}\s*/, ""), `h${key}`)}</h3>);
      i++;
      continue;
    }
    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        const cells = lines[i].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
        if (!cells.every(cell => /^:?-{2,}:?$/.test(cell))) rows.push(cells);
        i++;
      }
      blocks.push(
        <div className="answer-table-wrap" key={key++}>
          <table>
            {rows.length > 0 && <thead><tr>{rows[0].map((cell, ci) => <th key={ci}>{renderInline(cell, `th${key}-${ci}`)}</th>)}</tr></thead>}
            <tbody>{rows.slice(1).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell, `td${key}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (isListItem(line)) {
      const items: string[] = [];
      const ordered = /^\d+[.)]\s/.test(line);
      while (i < lines.length && isListItem(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^([-*•]|\d+[.)])\s*/, ""));
        i++;
      }
      const children = items.map((item, ii) => <li key={ii}>{renderInline(item, `li${key}-${ii}`)}</li>);
      blocks.push(ordered ? <ol key={key++}>{children}</ol> : <ul key={key++}>{children}</ul>);
      continue;
    }
    const paragraph: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || isHeading(next) || isTableRow(next) || isListItem(next)) break;
      paragraph.push(next);
      i++;
    }
    blocks.push(<p key={key++}>{renderInline(paragraph.join(" "), `p${key}`)}</p>);
  }
  return <div className="answer-body">{blocks}</div>;
}

const copy = {
  en: {
    tagline: "Learn · Understand · Shape the Future",
    nav: ["Explore", "Learn", "Timeline", "Careers", "Resources"],
    eyebrow: "YOUR MAP TO THE WORLD OF AI",
    titleA: "See the whole of AI.",
    titleB: "Understand how it connects.",
    intro: "Explore the ideas, history, people, risks and possibilities shaping artificial intelligence — in one connected universe.",
    question: "What are you curious about?",
    placeholder: "Ask anything about AI…",
    browse: "Browse topics",
    suggestion: "Try a guided question",
    mapLabel: "INTERACTIVE KNOWLEDGE MAP",
    mapTitle: "Start anywhere. Follow every connection.",
    history: "AI Timeline",
    historySub: "From logic to learning machines",
    guide: "AI Guide",
    guideText: "I’ll help you explore AI in plain language — then go deeper whenever you’re ready.",
    selected: "Selected concept",
    close: "Close",
    level: "Explanation level",
    levels: ["Beginner", "Intermediate", "Advanced"],
    established: "Established",
    askAbout: "Ask about this",
    guided: ["What is the difference between AI, ML and deep learning?", "How do large language models work?", "Which AI career fits me?"],
    answerIntro: "Here’s a clear starting point:",
    searching: ["Understanding your question…", "Checking AI Universe knowledge…", "Searching current sources when needed…", "Comparing evidence…"],
    cancel: "Stop",
    sources: "Sources",
    checked: "Checked",
    webChecked: "Web checked",
    knowledgeChecked: "Knowledge base",
    error: "The question could not be completed. Please try again.",
    answerFallback: "AI is a broad field of systems that perform tasks linked to human intelligence. A useful way to learn it is to begin with foundations, then follow the map through machine learning, deep learning and today’s generative models.",
    journey: "Choose a topic or ask in your own words.",
    journeySub: "Your AI learning journey starts here.",
    footer: "A structured, evidence-aware guide to AI’s past, present and future.",
    noNews: "Concepts are labeled by certainty. No fabricated live statistics or news.",
    progressTitle: "Learning progress",
    progressHint: "Ask about every topic at all three levels to reach 100%.",
    progressSteps: "steps completed",
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    authTitleLogin: "Welcome back",
    authTitleSignup: "Create your account",
    authHint: "Save your learning progress and continue on any device.",
    email: "Email",
    password: "Password (8+ characters)",
    nickname: "Name or nickname",
    authSubmitLogin: "Log in",
    authSubmitSignup: "Sign up",
    authToSignup: "New here? Sign up",
    authToLogin: "Already have an account? Log in",
    authErrors: {
      invalid_email: "Please enter a valid email address.",
      weak_password: "Password must be at least 8 characters.",
      name_required: "Please enter a name or nickname.",
      email_taken: "This email is already registered. Try logging in.",
      bad_credentials: "Email or password is incorrect.",
      not_configured: "Account storage is not connected yet. Please try again later.",
      generic: "Something went wrong. Please try again.",
    } as Record<string, string>,
    synced: "Progress synced to your account",
    expand: "Expand",
    panelHint: "Drag to move · resize from the corner",
    askedLabel: "Question",
    askChip: "Ask AI",
    reopenAnswer: "View last answer",
    glossaryTitle: "AI Glossary",
    glossaryHint: "Essential terms everyone should know, A to Z. Pick a word to see what it means.",
    guidesTitle: "Practical Guides",
    guidesHint: "Pick a topic and the AI guide will walk you through it.",
    safetyTitle: "Safety & Ethics",
    safetyHint: "Pick a topic to learn how to use AI safely and responsibly.",
    searchPh: "Search…",
    askMore: "Ask AI for a deeper explanation",
    noResult: "No matches found.",
    motionLabel: "Motion",
    motionOn: "Motion on — click to pause the universe",
    motionOff: "Motion paused — click to bring the universe back",
    dockLabel: "Dock to side",
    floatLabel: "Float freely",
    robotTitle: "AI Robot Guide",
    robotSub: "Pick a quest and I'll get to work.",
    questBrief: "3-Minute Quick Summary",
    questQuiz: "Test My Knowledge (Quiz)",
    questToolkit: "Real-world Prompt Toolkit",
    robotWorking: "Robot guide is preparing your quest…",
    starSave: "Save this answer",
    starSaved: "Saved to favorites",
  },
  ko: {
    tagline: "배우고 · 이해하고 · 미래를 준비하다",
    nav: ["탐색", "학습", "역사", "직무", "자료"],
    eyebrow: "AI 세계를 이해하는 하나의 지도",
    titleA: "AI의 전체 그림을 보고,",
    titleB: "서로의 연결을 이해하세요.",
    intro: "인공지능을 만드는 개념·역사·사람·위험·가능성을 하나로 연결된 세계에서 쉽고 체계적으로 탐색해 보세요.",
    question: "무엇이 궁금한가요?",
    placeholder: "AI에 관해 무엇이든 물어보세요…",
    browse: "주제 둘러보기",
    suggestion: "추천 질문 보기",
    mapLabel: "인터랙티브 지식 지도",
    mapTitle: "어디서든 시작하고, 모든 연결을 따라가세요.",
    history: "AI 역사",
    historySub: "논리학에서 학습하는 기계까지",
    guide: "AI 가이드",
    guideText: "AI를 쉬운 말로 설명하고, 준비가 되면 더 깊은 원리까지 안내해 드립니다.",
    selected: "선택한 개념",
    close: "닫기",
    level: "설명 난이도",
    levels: ["입문", "중급", "고급"],
    established: "확립된 개념",
    askAbout: "이 개념 질문하기",
    guided: ["AI·머신러닝·딥러닝은 무엇이 다른가요?", "대규모 언어 모델은 어떻게 작동하나요?", "어떤 AI 직무가 저와 맞을까요?"],
    answerIntro: "쉽게 시작해 보겠습니다:",
    searching: ["질문을 이해하고 있습니다…", "AI Universe 지식을 확인하고 있습니다…", "필요한 최신 자료를 검색하고 있습니다…", "출처를 비교하고 있습니다…"],
    cancel: "검색 중지",
    sources: "확인한 출처",
    checked: "확인 시각",
    webChecked: "웹 확인 완료",
    knowledgeChecked: "지식베이스 확인",
    error: "질문을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    answerFallback: "AI는 사람의 지능과 관련된 일을 수행하는 시스템을 연구하고 만드는 넓은 분야입니다. 기초 개념부터 시작해 머신러닝, 딥러닝, 오늘날의 생성형 AI 순서로 지도를 따라가면 전체 구조를 이해하기 쉽습니다.",
    journey: "주제를 선택하거나 직접 질문해 보세요.",
    journeySub: "AI를 이해하는 여정이 여기서 시작됩니다.",
    footer: "AI의 과거·현재·미래를 체계적이고 근거 중심으로 안내합니다.",
    noNews: "정보의 확실성을 구분하며, 가짜 최신 통계나 뉴스를 사용하지 않습니다.",
    progressTitle: "학습 진행률",
    progressHint: "모든 주제를 세 가지 난이도로 공부하면 100%가 됩니다.",
    progressSteps: "단계 완료",
    login: "로그인",
    signup: "회원가입",
    logout: "로그아웃",
    authTitleLogin: "다시 만나 반가워요",
    authTitleSignup: "계정 만들기",
    authHint: "학습 진행률을 저장하고 어떤 기기에서든 이어서 공부하세요.",
    email: "이메일",
    password: "비밀번호 (8자 이상)",
    nickname: "이름 또는 닉네임",
    authSubmitLogin: "로그인",
    authSubmitSignup: "가입하기",
    authToSignup: "처음이신가요? 회원가입",
    authToLogin: "이미 계정이 있나요? 로그인",
    authErrors: {
      invalid_email: "올바른 이메일 주소를 입력해 주세요.",
      weak_password: "비밀번호는 8자 이상이어야 합니다.",
      name_required: "이름 또는 닉네임을 입력해 주세요.",
      email_taken: "이미 가입된 이메일입니다. 로그인해 보세요.",
      bad_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
      not_configured: "계정 저장소가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      generic: "문제가 발생했습니다. 다시 시도해 주세요.",
    } as Record<string, string>,
    synced: "진행률이 계정에 저장됩니다",
    expand: "크게 보기",
    panelHint: "머리글을 끌어 이동 · 모서리를 끌어 크기 조절",
    askedLabel: "질문",
    askChip: "질문하기",
    reopenAnswer: "지난 답변 보기",
    glossaryTitle: "AI 용어사전",
    glossaryHint: "일반인이 꼭 알아야 할 핵심 용어를 알파벳순으로 모았습니다. 단어를 고르면 설명이 나옵니다.",
    guidesTitle: "실전 가이드",
    guidesHint: "주제를 고르면 AI 가이드가 단계별로 안내해 드립니다.",
    safetyTitle: "안전과 윤리",
    safetyHint: "주제를 고르면 AI를 안전하고 책임 있게 쓰는 법을 알려 드립니다.",
    searchPh: "찾아보기…",
    askMore: "AI에게 자세히 묻기",
    noResult: "검색 결과가 없습니다.",
    motionLabel: "모션",
    motionOn: "모션 켜짐 — 누르면 우주가 잠시 멈춥니다",
    motionOff: "모션 멈춤 — 누르면 우주가 다시 움직입니다",
    dockLabel: "옆에 고정",
    floatLabel: "자유 배치",
    robotTitle: "AI 로봇 가이드",
    robotSub: "퀘스트를 고르면 바로 준비할게요.",
    questBrief: "3분 핵심 요약",
    questQuiz: "내 실력 퀴즈",
    questToolkit: "실전 프롬프트 툴킷",
    robotWorking: "로봇 가이드가 답을 준비 중…",
    starSave: "이 답변 저장",
    starSaved: "즐겨찾기에 저장됨",
  },
};

const topics = [
  { id: "history", icon: "📜", color: "gold", en: "AI History", ko: "AI 역사", enD: "How ideas became intelligent machines.", koD: "생각이 지능형 기계로 발전한 과정입니다." },
  { id: "foundations", icon: "📐", color: "blue", en: "Foundations", ko: "기초", enD: "Logic, mathematics, data and algorithms.", koD: "논리·수학·데이터·알고리즘의 토대입니다." },
  { id: "ml", icon: "📊", color: "cyan", en: "Machine Learning", ko: "머신러닝", enD: "Systems that learn patterns from data.", koD: "데이터에서 패턴을 배우는 시스템입니다." },
  { id: "deep", icon: "🧠", color: "violet", en: "Deep Learning", ko: "딥러닝", enD: "Layered neural networks at scale.", koD: "대규모 다층 신경망을 활용하는 학습입니다." },
  { id: "gen", icon: "🎨", color: "pink", en: "Generative AI", ko: "생성형 AI", enD: "AI that creates text, images and more.", koD: "글·이미지 등 새 콘텐츠를 만드는 AI입니다." },
  { id: "llm", icon: "💬", color: "mint", en: "Large Language Models", ko: "대규모 언어 모델", enD: "Models that predict and generate language.", koD: "언어를 예측하고 생성하는 모델입니다." },
  { id: "agents", icon: "🤖", color: "magenta", en: "AI Agents", ko: "AI 에이전트", enD: "Systems that plan, use tools and act.", koD: "계획하고 도구를 사용해 행동하는 시스템입니다." },
  { id: "current", icon: "⚡", color: "green", en: "Current AI", ko: "현재의 AI", enD: "Today’s capabilities and limitations.", koD: "오늘날 AI의 능력과 한계를 살펴봅니다." },
  { id: "future", icon: "🚀", color: "orange", en: "Future AI", ko: "미래의 AI", enD: "Evolving, experimental and speculative paths.", koD: "진화·실험·전망 단계의 미래를 구분합니다." },
  { id: "ethics", icon: "🛡️", color: "rose", en: "Ethics & Safety", ko: "윤리와 안전", enD: "Bias, privacy, governance and responsibility.", koD: "편향·개인정보·거버넌스·책임을 다룹니다." },
];

// 좌측 타임라인 인라인 아코디언용 핵심 지식 (EN/KR)
const timelineDetails: Array<[string, string]> = [
  ["Alan Turing asked \"Can machines think?\" and proposed the imitation game — judging intelligence by whether a machine's conversation is indistinguishable from a human's. It framed how we still evaluate AI today.", "앨런 튜링이 \"기계가 생각할 수 있는가?\"라는 질문과 함께 모방 게임을 제안했습니다. 기계의 대화가 사람과 구별되지 않으면 지능으로 본다는 기준으로, 오늘날 AI 평가의 출발점이 되었습니다."],
  ["At the Dartmouth workshop, John McCarthy coined the term 'Artificial Intelligence'. Researchers believed human intelligence could be precisely described and simulated — the field of AI was born.", "다트머스 워크숍에서 존 매카시가 '인공지능'이라는 용어를 만들었습니다. 인간 지능을 정확히 기술해 기계로 모사할 수 있다는 믿음 아래 AI라는 학문 분야가 탄생했습니다."],
  ["Rule-based expert systems boomed in industry, then hit their limits — brittle rules, high costs. Funding collapsed into the 'AI winter', teaching the field that hype cycles are real.", "규칙 기반 전문가 시스템이 산업에서 호황을 누렸지만 경직된 규칙과 높은 비용이라는 한계에 부딪혔습니다. 투자가 얼어붙는 'AI 겨울'이 왔고, 과열-침체 사이클의 교훈을 남겼습니다."],
  ["AlexNet crushed the ImageNet competition using deep neural networks trained on GPUs, halving the error rate. Deep learning went from niche to mainstream overnight.", "AlexNet이 GPU로 학습한 심층 신경망으로 이미지넷 대회를 압도하며 오류율을 절반 가까이 낮췄습니다. 딥러닝이 하룻밤 사이 비주류에서 주류로 올라선 사건입니다."],
  ["The paper 'Attention Is All You Need' introduced the Transformer — processing context in parallel with attention. It became the foundation of GPT, Claude and every modern LLM.", "'Attention Is All You Need' 논문이 트랜스포머 구조를 제시했습니다. 어텐션으로 맥락을 병렬 처리하는 이 구조가 GPT·Claude 등 모든 현대 LLM의 기반이 되었습니다."],
];

const timeline = [
  ["1950", "Turing’s imitation game", "튜링의 모방 게임"],
  ["1956", "The field receives the name ‘AI’", "‘인공지능’이라는 분야의 탄생"],
  ["1980s", "Expert systems and AI winter", "전문가 시스템과 AI 겨울"],
  ["2012", "Deep learning breakthrough", "딥러닝의 결정적 도약"],
  ["2017", "Transformer architecture", "트랜스포머 구조의 등장"],
  ["2020s", "Generative and multimodal AI", "생성형·멀티모달 AI 시대"],
];

const learningCards = [
  ["01", "AI Basics", "AI 기초", "Build a strong mental model without the jargon.", "전문용어에 갇히지 않고 핵심 구조를 이해합니다."],
  ["02", "How Models Learn", "모델은 어떻게 배우나", "Follow data through training, prediction and evaluation.", "데이터가 학습·예측·평가로 이어지는 과정을 봅니다."],
  ["03", "Generative AI", "생성형 AI", "Understand tokens, transformers, prompting and RAG.", "토큰·트랜스포머·프롬프팅·RAG를 이해합니다."],
  ["04", "AI in Practice", "AI 실전 활용", "Apply AI to business, creation, research and code.", "사업·창작·연구·개발에 AI를 적용합니다."],
];

const roles = [
  ["AI Research Scientist", "AI 연구 과학자", "Develops new methods and investigates fundamental questions.", "새로운 방법을 개발하고 근본적인 연구 문제를 탐구합니다."],
  ["ML Engineer", "머신러닝 엔지니어", "Builds, deploys and maintains learning systems.", "학습 시스템을 만들고 배포·운영합니다."],
  ["AI Product Manager", "AI 프로덕트 매니저", "Connects user needs, business goals and AI capabilities.", "사용자 요구·사업 목표·AI 역량을 연결합니다."],
  ["AI Safety Specialist", "AI 안전 전문가", "Evaluates risk and helps systems behave responsibly.", "위험을 평가하고 시스템의 책임 있는 작동을 돕습니다."],
];

// 일반인이 꼭 알아야 할 핵심 AI 용어 (알파벳순)
const glossary = [
  { term: "AGI", ko: "인공 일반 지능", enD: "Hypothetical AI that could perform almost any intellectual task a human can, across all domains.", koD: "사람이 하는 거의 모든 지적 작업을 수행할 수 있다고 가정하는 범용 인공지능입니다." },
  { term: "AI", ko: "인공지능", enD: "Systems that perform tasks associated with human intelligence, like understanding language or recognizing images.", koD: "언어 이해, 이미지 인식처럼 사람의 지능과 관련된 일을 수행하는 시스템입니다." },
  { term: "AI Agent", ko: "AI 에이전트", enD: "AI that plans, uses tools and takes multi-step actions toward a goal — not just answering questions.", koD: "단순 답변을 넘어 목표를 향해 계획하고 도구를 쓰며 여러 단계를 실행하는 AI입니다." },
  { term: "Algorithm", ko: "알고리즘", enD: "A step-by-step set of rules a computer follows to solve a problem.", koD: "문제를 풀기 위해 컴퓨터가 따르는 단계별 규칙의 모음입니다." },
  { term: "Alignment", ko: "정렬", enD: "Research and techniques for making AI act according to human intentions and values.", koD: "AI가 사람의 의도와 가치에 맞게 행동하도록 만드는 연구와 기술입니다." },
  { term: "API", ko: "API", enD: "A way for programs to talk to each other — how apps connect to AI models.", koD: "프로그램끼리 소통하는 통로로, 앱이 AI 모델을 불러 쓰는 방식입니다." },
  { term: "Bias", ko: "편향", enD: "Unfair patterns an AI learns from its data, leading to skewed or discriminatory results.", koD: "데이터에서 학습된 불공정한 경향으로, 치우친 결과를 만드는 원인입니다." },
  { term: "Chatbot", ko: "챗봇", enD: "A program that converses in natural language, like ChatGPT.", koD: "ChatGPT처럼 자연어로 대화하는 프로그램입니다." },
  { term: "Context Window", ko: "컨텍스트 윈도우", enD: "How much text an AI can consider at once in a conversation — its working memory.", koD: "AI가 한 번의 대화에서 기억할 수 있는 텍스트의 양, 즉 작업 기억입니다." },
  { term: "Copilot", ko: "코파일럿", enD: "An AI assistant embedded in tools like documents, code editors or email to help as you work.", koD: "문서·코드·이메일 등 작업 도구 안에서 실시간으로 돕는 AI 비서입니다." },
  { term: "Deep Learning", ko: "딥러닝", enD: "Machine learning using many-layered neural networks; the engine of modern AI.", koD: "여러 층의 신경망으로 학습하는 방식으로, 현대 AI의 핵심 기술입니다." },
  { term: "Deepfake", ko: "딥페이크", enD: "AI-made fake images, video or audio that look and sound real.", koD: "실제처럼 보이고 들리도록 AI로 만든 가짜 이미지·영상·음성입니다." },
  { term: "Fine-tuning", ko: "파인튜닝", enD: "Further training an existing model on specific data to specialize it.", koD: "이미 학습된 모델을 특정 데이터로 추가 학습시켜 특화하는 과정입니다." },
  { term: "Generative AI", ko: "생성형 AI", enD: "AI that creates new content — text, images, audio, video or code.", koD: "글·이미지·음성·영상·코드 등 새로운 콘텐츠를 만들어내는 AI입니다." },
  { term: "GPU", ko: "GPU", enD: "The chip that performs the massive parallel math AI needs; the key AI hardware.", koD: "AI에 필요한 대규모 병렬 연산을 처리하는 칩으로, 핵심 AI 하드웨어입니다." },
  { term: "Hallucination", ko: "환각", enD: "When AI confidently states things that are false or made up.", koD: "AI가 사실이 아닌 내용을 그럴듯하게 지어내는 현상입니다." },
  { term: "Inference", ko: "추론(실행)", enD: "Running a trained model to get answers — as opposed to training it.", koD: "학습이 끝난 모델을 실제로 실행해 답을 얻는 단계입니다." },
  { term: "LLM", ko: "대규모 언어 모델", enD: "Large Language Model — AI trained on vast text to understand and generate language.", koD: "방대한 텍스트로 학습해 언어를 이해하고 생성하는 대규모 언어 모델입니다." },
  { term: "Machine Learning", ko: "머신러닝", enD: "AI that learns patterns from data instead of following hand-written rules.", koD: "규칙을 직접 짜는 대신 데이터에서 패턴을 배우는 AI 방식입니다." },
  { term: "Multimodal", ko: "멀티모달", enD: "AI that handles multiple formats — text, images, audio and video together.", koD: "텍스트·이미지·음성·영상을 함께 다루는 AI입니다." },
  { term: "Neural Network", ko: "신경망", enD: "A brain-inspired structure of connected nodes that learns from examples.", koD: "뇌 신경망을 본떠 연결된 노드들이 예시에서 학습하는 구조입니다." },
  { term: "On-device AI", ko: "온디바이스 AI", enD: "AI that runs on your phone or PC without sending data to the cloud.", koD: "데이터를 클라우드로 보내지 않고 휴대폰·PC에서 직접 실행되는 AI입니다." },
  { term: "Open-source Model", ko: "오픈소스 모델", enD: "A model whose weights are public, so anyone can run or modify it.", koD: "가중치가 공개되어 누구나 내려받아 실행·수정할 수 있는 모델입니다." },
  { term: "Prompt", ko: "프롬프트", enD: "The instruction or question you give an AI.", koD: "AI에게 주는 지시문 또는 질문입니다." },
  { term: "Prompt Engineering", ko: "프롬프트 엔지니어링", enD: "Crafting prompts to get better, more reliable AI results.", koD: "더 좋고 안정적인 결과를 얻도록 프롬프트를 설계하는 기술입니다." },
  { term: "RAG", ko: "검색 증강 생성", enD: "Retrieval-Augmented Generation — AI searches relevant documents first, then answers using them.", koD: "답하기 전에 관련 자료를 먼저 검색해 그 근거로 답변하는 방식입니다." },
  { term: "Reasoning Model", ko: "추론 모델", enD: "A model that thinks through steps before answering; better at complex problems.", koD: "답하기 전에 단계적으로 생각하는 모델로, 복잡한 문제에 강합니다." },
  { term: "Token", ko: "토큰", enD: "The small chunks of text AI processes — roughly parts of words; also how usage is billed.", koD: "AI가 처리하는 텍스트 조각 단위로, 사용량 과금의 기준이기도 합니다." },
  { term: "Training Data", ko: "학습 데이터", enD: "The examples a model learns from; its quality shapes the AI's behavior.", koD: "모델이 학습하는 예시 데이터로, 품질이 AI의 성능과 성향을 좌우합니다." },
  { term: "Transformer", ko: "트랜스포머", enD: "The 2017 architecture behind modern LLMs, using attention to weigh context.", koD: "'어텐션'으로 맥락을 파악하는 2017년 구조로, 현대 LLM의 기반입니다." },
];

// 실전 가이드 주제 (클릭 시 AI 가이드에게 질문)
const practicalGuides = [
  ["How to write good prompts", "프롬프트 잘 쓰는 법"],
  ["Using AI at work", "업무에 AI 활용하기"],
  ["Writing and summarizing with AI", "AI로 글쓰기·요약하기"],
  ["Getting started with image generation", "이미지 생성 시작하기"],
  ["AI search and fact-checking", "AI 검색과 사실 확인"],
  ["Choosing the right AI tools", "나에게 맞는 AI 도구 고르기"],
  ["Automating notes and email", "회의록·이메일 자동화"],
  ["Using AI for data analysis", "데이터 분석에 AI 쓰기"],
];

// 안전과 윤리 주제 (클릭 시 AI 가이드에게 질문)
const safetyTopics = [
  ["How to spot deepfakes", "딥페이크 구별법"],
  ["Protecting privacy when using AI", "개인정보 지키며 AI 쓰기"],
  ["Understanding AI bias", "AI 편향 이해하기"],
  ["AI and copyright", "AI와 저작권"],
  ["Kids and AI safety", "아이들과 AI 안전"],
  ["Spotting misinformation", "가짜뉴스·허위정보 판별"],
  ["Dealing with AI hallucinations", "AI 환각 대처법"],
  ["Principles of responsible AI use", "책임 있는 AI 사용 원칙"],
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [section, setSection] = useState<Section>("explore");
  const [selected, setSelected] = useState(topics[5]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Array<{title:string;url:string}>>([]);
  const [checkedAt, setCheckedAt] = useState("");
  const [usedWeb, setUsedWeb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [askError, setAskError] = useState("");
  const [level, setLevel] = useState(0);
  const [menu, setMenu] = useState(false);
  // 학습 진행률: "주제id:난이도" 단위로 완료를 기록 (10주제 × 3난이도 = 30단계 = 100%)
  const [studyProgress, setStudyProgress] = useState<Record<string, boolean>>({});
  // 회원 계정: 로그인하면 진행률이 서버에 동기화되어 기기 간 유지
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  // 질문창: 평소엔 우측 상단 칩으로 접힘, 누르면 중앙에 펼쳐짐 (모든 페이지 공통)
  const [askOpen, setAskOpen] = useState(false);
  // 모션 스위치: 사용자가 우주 애니메이션을 켜고 끌 수 있음 (OS 동작줄이기 설정을 초기값으로 존중)
  const [motionEnabled, setMotionEnabled] = useState(true);
  // 스크롤 트리거: 최상단에서는 천체 정지, 스크롤 시작(>30px) 시 깨어남
  const [isScrolled, setIsScrolled] = useState(false);
  // 좌측 타임라인 인라인 아코디언 (열린 연도 index)
  const [expandedEra, setExpandedEra] = useState<number | null>(null);
  // 현재 답변 즐겨찾기 여부
  const [starred, setStarred] = useState(false);
  // 답변 패널 도킹 모드: 우측 30% 고정 + 본문 좌측 정렬
  const [isDocked, setIsDocked] = useState(false);
  // 로봇 가이드 대시보드: 활성 카드 id("learn-0"/"career-2")와 모듈별 퀘스트 결과
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [questResult, setQuestResult] = useState<Record<string, { loading: boolean; data: string | null; error: string | null }>>({});
  // 자료 섹션: 용어사전 선택·섹션별 찾아보기 검색어
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [glossQuery, setGlossQuery] = useState("");
  const [guideQuery, setGuideQuery] = useState("");
  const [safetyQuery, setSafetyQuery] = useState("");
  // 지식지도 노드 클릭 시: 혜성이 선을 그으며 선택 박스로 날아가고, 도착하면 박스가 번쩍임
  const [flight, setFlight] = useState<{ x1: number; y1: number; x2: number; y2: number; id: number } | null>(null);
  const [stripFlash, setStripFlash] = useState(false);
  const stripRef = useRef<HTMLElement | null>(null);
  const flightTimers = useRef<number[]>([]);
  // 확장 답변 패널: 기본은 화면 중앙, 사용자가 드래그로 이동·모서리로 크기 조절
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 패널 머리글 드래그로 이동 (버튼 클릭은 제외, 화면 밖으로 나가지 않게 제한)
  function startPanelDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (isDocked) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const panel = panelRef.current;
    if (!panel) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    function onMove(ev: PointerEvent) {
      const x = Math.min(Math.max(ev.clientX - offsetX, 60 - rect.width), window.innerWidth - 60);
      const y = Math.min(Math.max(ev.clientY - offsetY, 0), window.innerHeight - 50);
      setPanelPos({ x, y });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  useEffect(() => {
    // 스크롤 트리거: 30px 이상 스크롤 시 천체 애니메이션 활성화
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // 모션·도킹 선호 복원 (모션 초기값은 OS 동작줄이기 설정 존중, 사용자 저장값이 우선)
    try {
      const savedMotion = localStorage.getItem("aiu-motion");
      if (savedMotion !== null) setMotionEnabled(savedMotion === "1");
      else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMotionEnabled(false);
      const savedDock = localStorage.getItem("aiu-docked");
      if (savedDock !== null) setIsDocked(savedDock === "1");
    } catch { /* 무시 */ }
    let localSteps: Record<string, boolean> = {};
    try {
      const saved = localStorage.getItem("aiu-progress");
      if (saved) localSteps = JSON.parse(saved) as Record<string, boolean>;
    } catch { /* 저장된 진행률이 손상된 경우 무시 */ }
    setStudyProgress(localSteps);
    // 로그인 세션이 있으면 서버 진행률과 병합
    void fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then((data: { user?: { email: string; name: string } | null; progress?: string[] } | null) => {
        if (!data?.user) return;
        setUser(data.user);
        mergeServerProgress(localSteps, data.progress ?? []);
      })
      .catch(() => { /* 오프라인 등에서는 로컬 진행률만 사용 */ });
  }, []);

  // 로컬·서버 진행률을 합집합으로 병합하고, 서버에 없는 단계는 올려서 맞춤
  function mergeServerProgress(localSteps: Record<string, boolean>, serverSteps: string[]) {
    const merged: Record<string, boolean> = { ...localSteps };
    for (const step of serverSteps) merged[step] = true;
    setStudyProgress(merged);
    try { localStorage.setItem("aiu-progress", JSON.stringify(merged)); } catch { /* 무시 */ }
    const missingOnServer = Object.keys(localSteps).filter(step => !serverSteps.includes(step));
    if (missingOnServer.length > 0) {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: missingOnServer }),
      }).catch(() => { /* 다음 방문 때 재시도됨 */ });
    }
  }

  function markStudied(topicId: string, levelIndex: number) {
    const stepKey = `${topicId}:${levelIndex}`;
    setStudyProgress(prev => {
      if (prev[stepKey]) return prev;
      const next = { ...prev, [stepKey]: true };
      try { localStorage.setItem("aiu-progress", JSON.stringify(next)); } catch { /* 저장 불가 환경 무시 */ }
      return next;
    });
    if (user) {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepKey }),
      }).catch(() => { /* 다음 병합 때 재동기화 */ });
    }
  }

  async function submitAuth(e: FormEvent) {
    e.preventDefault();
    if (authLoading) return;
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = authMode === "signup"
        ? { email: authEmail, password: authPassword, name: authName }
        : { email: authEmail, password: authPassword };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { user?: { email: string; name: string }; error?: string };
      if (!response.ok || !data.user) {
        const code = data.error && t.authErrors[data.error] ? data.error : response.status === 503 ? "not_configured" : "generic";
        setAuthError(t.authErrors[code]);
        return;
      }
      setUser(data.user);
      setAuthOpen(false);
      setAuthPassword("");
      // 로그인 직후 서버 진행률을 받아 로컬과 양방향 병합
      try {
        const progressRes = await fetch("/api/progress");
        const progressData = progressRes.ok ? await progressRes.json() as { progress?: string[] } : null;
        mergeServerProgress(studyProgress, progressData?.progress ?? []);
      } catch {
        mergeServerProgress(studyProgress, []);
      }
    } catch {
      setAuthError(t.authErrors.generic);
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* 쿠키 만료로도 정리됨 */ }
    setUser(null);
  }

  const totalSteps = topics.length * 3;
  const doneSteps = Object.keys(studyProgress).length;
  const progressPercent = Math.min(100, Math.round((doneSteps / totalSteps) * 100));
  const t = copy[lang];
  const title = (item: typeof topics[number]) => lang === "en" ? item.en : item.ko;
  const description = (item: typeof topics[number]) => lang === "en" ? item.enD : item.koD;

  const activeContent = useMemo(() => {
    if (section === "learn") return "learn";
    if (section === "timeline") return "timeline";
    if (section === "careers") return "careers";
    if (section === "resources") return "resources";
    return "explore";
  }, [section]);

  async function submit(e?: FormEvent, overrideQuestion?: string) {
    e?.preventDefault();
    const q = (overrideQuestion ?? question).trim();
    if (!q || loading) return;
    setQuestion(q);
    setAnswer("");
    setCitations([]);
    setCheckedAt("");
    setAskError("");
    setAskOpen(true);
    setLoading(true);
    setLoadingStep(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setInterval(() => setLoadingStep(step => Math.min(step + 1, 3)), 1700);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          language: lang,
          level: (["beginner", "intermediate", "advanced"] as const)[level],
          selectedTopic: title(selected),
        }),
        signal: controller.signal,
      });
      const data = await response.json() as {
        answer?: string;
        citations?: Array<{title:string;url:string}>;
        checkedAt?: string;
        usedWeb?: boolean;
        error?: string;
      };
      if (!response.ok || !data.answer) throw new Error(data.error || t.error);
      setAnswer(data.answer);
      setCitations(data.citations ?? []);
      setCheckedAt(data.checkedAt ?? "");
      setUsedWeb(Boolean(data.usedWeb));
      setStarred(false);
      setAskOpen(false);
      setPanelOpen(true);
      markStudied(selected.id, level);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setAskError(error instanceof Error ? error.message : t.error);
    } finally {
      window.clearInterval(timer);
      abortRef.current = null;
      setLoading(false);
    }
  }

  function chooseQuestion(q: string) {
    void submit(undefined, q);
  }

  // 지식지도 노드 선택: 혜성 비행 이펙트 + 선택 박스 번쩍임
  function selectTopic(item: typeof topics[number], sourceEl: HTMLElement | null) {
    setSelected(item);
    flightTimers.current.forEach(timer => window.clearTimeout(timer));
    flightTimers.current = [];
    const stripEl = stripRef.current;
    if (motionEnabled && sourceEl && stripEl) {
      const from = sourceEl.getBoundingClientRect();
      const to = stripEl.getBoundingClientRect();
      setFlight({
        x1: from.left + from.width / 2,
        y1: from.top + from.height / 2,
        x2: to.left + to.width / 2,
        y2: to.top + 6,
        id: Date.now(),
      });
      setStripFlash(false);
      flightTimers.current.push(window.setTimeout(() => setStripFlash(true), 680));
      flightTimers.current.push(window.setTimeout(() => setFlight(null), 1500));
      flightTimers.current.push(window.setTimeout(() => setStripFlash(false), 2100));
    } else {
      // 모션 꺼짐 또는 좌표를 얻을 수 없는 경우: 비행 생략, 번쩍임으로 즉각 점프
      setStripFlash(false);
      flightTimers.current.push(window.setTimeout(() => setStripFlash(true), 30));
      flightTimers.current.push(window.setTimeout(() => setStripFlash(false), 1400));
    }
  }

  // 학습·직무·자료 페이지 버튼에서 탐색 화면으로 이동해 AI 가이드에게 질문
  function askFromPage(q: string) {
    setSection("explore");
    window.scrollTo({ top: 200, behavior: "smooth" });
    void submit(undefined, q);
  }

  // 현재 답변을 즐겨찾기에 저장/해제 (localStorage, 최근 50개 유지)
  function toggleStar() {
    try {
      const raw = JSON.parse(localStorage.getItem("aiu-starred") ?? "[]") as Array<{ q: string; a: string; at: string }>;
      const next = starred
        ? raw.filter(item => item.at !== checkedAt)
        : [...raw.filter(item => item.at !== checkedAt), { q: question, a: answer, at: checkedAt }].slice(-50);
      localStorage.setItem("aiu-starred", JSON.stringify(next));
    } catch { /* 저장 불가 환경 무시 */ }
    setStarred(!starred);
  }

  // 모션 스위치: 사용자 선택을 영구 저장 (OS 설정보다 우선)
  function toggleMotion() {
    setMotionEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("aiu-motion", next ? "1" : "0"); } catch { /* 무시 */ }
      return next;
    });
  }

  // 도킹 모드 토글: 우측 30% 고정 ↔ 자유 배치
  function toggleDock() {
    setIsDocked(prev => {
      const next = !prev;
      try { localStorage.setItem("aiu-docked", next ? "1" : "0"); } catch { /* 무시 */ }
      return next;
    });
  }

  // 로봇 가이드: 활성 모듈 id → 표시 이름
  function moduleName(moduleId: string) {
    const [kind, indexStr] = moduleId.split("-");
    const index = Number(indexStr);
    if (kind === "learn") return lang === "en" ? learningCards[index][1] : learningCards[index][2];
    return lang === "en" ? roles[index][0] : roles[index][1];
  }

  // 로봇 가이드 퀘스트 실행: 페이지를 떠나지 않고 대시보드 안에 인라인 렌더
  async function runQuest(moduleId: string, quest: "brief" | "quiz" | "toolkit") {
    if (questResult[moduleId]?.loading) return;
    const name = moduleName(moduleId);
    const prompts = {
      brief: lang === "en"
        ? `Give me a crisp 3-minute summary of "${name}": the core concepts, why it matters, and one real example.`
        : `"${name}"의 핵심을 3분 분량으로 요약해 주세요: 핵심 개념, 왜 중요한지, 실제 예시 1개.`,
      quiz: lang === "en"
        ? `Create a quiz on "${name}": 3 questions (mix short-answer and multiple-choice) from beginner to advanced. Put all answers and short explanations together at the very end.`
        : `"${name}" 퀴즈를 내 주세요: 단답형과 선택형을 섞어 입문부터 고급까지 3문항. 정답과 짧은 해설은 맨 마지막에 모아 주세요.`,
      toolkit: lang === "en"
        ? `Give me a real-world prompt toolkit for "${name}": 3 copy-ready prompt templates with notes on when to use each.`
        : `"${name}" 실전 프롬프트 툴킷을 주세요: 바로 복사해 쓸 수 있는 템플릿 3개와 각각의 활용 시점.`,
    };
    setQuestResult(prev => ({ ...prev, [moduleId]: { loading: true, data: null, error: null } }));
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompts[quest],
          language: lang,
          level: (["beginner", "intermediate", "advanced"] as const)[level],
          selectedTopic: name,
        }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || t.error);
      setQuestResult(prev => ({ ...prev, [moduleId]: { loading: false, data: data.answer ?? null, error: null } }));
    } catch (error) {
      setQuestResult(prev => ({ ...prev, [moduleId]: { loading: false, data: null, error: error instanceof Error ? error.message : t.error } }));
    }
  }

  // 로봇 가이드 인라인 대시보드 (학습·직무 공용)
  function robotDashboard() {
    if (!activeModuleId) return null;
    const result = questResult[activeModuleId];
    const name = moduleName(activeModuleId);
    return (
      <div className="robot-guide-dashboard glass-card">
        <div className="robot-avatar"><div className="bot mini"><span className="antenna a1"/><span className="antenna a2"/><b>⌁</b></div></div>
        <div className="robot-body">
          <div className="robot-title-row"><b>{t.robotTitle}</b><span>· {name}</span><button type="button" className="robot-close" aria-label={t.close} onClick={() => setActiveModuleId(null)}>×</button></div>
          <p className="robot-sub">{t.robotSub}</p>
          <div className="quest-buttons">
            <button type="button" onClick={() => void runQuest(activeModuleId, "brief")}>⚡ {t.questBrief}</button>
            <button type="button" onClick={() => void runQuest(activeModuleId, "quiz")}>❓ {t.questQuiz}</button>
            <button type="button" onClick={() => void runQuest(activeModuleId, "toolkit")}>🛠️ {t.questToolkit}</button>
          </div>
          {result?.loading && <div className="quest-loading"><span className="search-spinner"/><b>{t.robotWorking}</b></div>}
          {result?.error && <div className="ask-error" role="alert"><span>!</span><p>{result.error}</p></div>}
          {result?.data && <div className="quest-answer"><MarkdownAnswer text={result.data}/></div>}
        </div>
      </div>
    );
  }

  function changeLanguage(next: Lang) {
    setLang(next);
    setAnswer("");
    setCitations([]);
    setAskError("");
    setQuestion("");
    // 퀘스트 결과는 언어별 답변이므로 초기화
    setActiveModuleId(null);
    setQuestResult({});
  }

  return (
    <main className={`universe-shell${motionEnabled ? "" : " motion-paused"}${isScrolled ? " space-moving" : " space-frozen"}${isDocked && panelOpen && answer ? " docked-mode" : ""}`}>
      <div className="star-field" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
      <header className="topbar">
        <button className="brand" onClick={() => setSection("explore")} aria-label="AI Universe home">
          <span className="brand-mark">A<span>I</span></span>
          <span><b>{lang === "en" ? "AI Universe" : "AI 유니버스"}</b><small>{t.tagline}</small></span>
        </button>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Open navigation">☰</button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {(["explore", "learn", "timeline", "careers", "resources"] as Section[]).map((item, i) => (
            <button key={item} className={section === item ? "active" : ""} onClick={() => {setSection(item); setMenu(false);}}>{t.nav[i]}</button>
          ))}
        </nav>
        <div className="language" aria-label="Language selector">
          <button className={lang === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
          <span>/</span>
          <button className={lang === "ko" ? "active" : ""} onClick={() => changeLanguage("ko")}>KR</button>
        </div>
        <button
          className={motionEnabled ? "motion-toggle" : "motion-toggle off"}
          onClick={toggleMotion}
          aria-pressed={!motionEnabled}
          title={motionEnabled ? t.motionOn : t.motionOff}
          aria-label={t.motionLabel}
        >👁</button>
        <div className="account-area">
          {user
            ? <><span className="account-name" title={user.email}>✦ {user.name}</span><button className="account-button" onClick={() => void logout()}>{t.logout}</button></>
            : <button className="account-button primary" onClick={() => {setAuthMode("signup"); setAuthError(""); setAuthOpen(true);}}>{t.signup}</button>}
        </div>
      </header>

      {authOpen && <div className="auth-overlay" role="dialog" aria-modal="true" aria-label={authMode === "signup" ? t.authTitleSignup : t.authTitleLogin} onClick={e => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
        <form className="auth-card glass-card" onSubmit={submitAuth}>
          <button type="button" className="auth-close" aria-label={t.close} onClick={() => setAuthOpen(false)}>×</button>
          <h2>{authMode === "signup" ? t.authTitleSignup : t.authTitleLogin}</h2>
          <p className="auth-hint">{t.authHint}</p>
          {authMode === "signup" && <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={t.nickname} maxLength={40} autoComplete="nickname" required/>}
          <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={t.email} maxLength={254} autoComplete="email" required/>
          <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder={t.password} minLength={8} maxLength={200} autoComplete={authMode === "signup" ? "new-password" : "current-password"} required/>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button type="submit" className="primary-button" disabled={authLoading}>{authLoading ? "···" : authMode === "signup" ? t.authSubmitSignup : t.authSubmitLogin}</button>
          <button type="button" className="auth-switch" onClick={() => {setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError("");}}>
            {authMode === "signup" ? t.authToLogin : t.authToSignup}
          </button>
        </form>
      </div>}

      {flight && <svg className="flight-layer" key={flight.id} aria-hidden="true">
        <defs>
          <linearGradient id="flight-grad" gradientUnits="userSpaceOnUse" x1={flight.x1} y1={flight.y1} x2={flight.x2} y2={flight.y2}>
            <stop offset="0%" stopColor="#4f83ff" stopOpacity="0"/>
            <stop offset="45%" stopColor="#59d6ff"/>
            <stop offset="100%" stopColor="#c2f1ff"/>
          </linearGradient>
        </defs>
        <line
          className="flight-line"
          x1={flight.x1} y1={flight.y1} x2={flight.x2} y2={flight.y2}
          style={{
            strokeDasharray: Math.hypot(flight.x2 - flight.x1, flight.y2 - flight.y1),
            strokeDashoffset: Math.hypot(flight.x2 - flight.x1, flight.y2 - flight.y1),
          }}
        />
        <g className="flight-comet">
          <circle r="5"/>
          <circle r="2.2" className="flight-comet-core"/>
          <animateMotion dur="0.68s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.7 1" keyTimes="0;1" path={`M ${flight.x1} ${flight.y1} L ${flight.x2} ${flight.y2}`}/>
        </g>
      </svg>}

      {!askOpen && <button className="ask-chip" onClick={() => setAskOpen(true)} aria-label={t.question}>
        <span className="ask-chip-inner"><i>✦</i>{t.askChip}</span>
      </button>}

      {askOpen && <div className="ask-overlay" role="dialog" aria-modal="false" aria-label={t.question}>
        <form className="ask-float glass-card" onSubmit={submit}>
          <button type="button" className="ask-close" aria-label={t.close} onClick={() => setAskOpen(false)}>✕</button>
          <span className="ask-spark">✦</span>
          <h2>{t.question}</h2>
          <div className="level-toggle" role="radiogroup" aria-label={t.level}>
            {t.levels.map((label, i) => <button type="button" key={label} className={level === i ? "active" : ""} aria-pressed={level === i} onClick={() => setLevel(i)}>{label}</button>)}
          </div>
          <div className="question-box"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} maxLength={1200} disabled={loading} autoFocus/><button aria-label="Send question" disabled={loading}>{loading ? "···" : "➤"}</button></div>
          <div className="ask-actions"><button type="button" onClick={() => {setAskOpen(false); setSection("explore"); window.setTimeout(() => document.getElementById("topic-grid")?.scrollIntoView({behavior:"smooth"}), 80);}}>⌘ {t.browse}</button><span>or</span><button type="button" onClick={() => chooseQuestion(t.guided[0])}>◇ {t.suggestion}</button></div>
          {loading && <div className="search-progress" role="status"><span className="search-spinner"/><b>{t.searching[loadingStep]}</b><button type="button" onClick={() => abortRef.current?.abort()}>{t.cancel}</button></div>}
          {askError && <div className="ask-error" role="alert"><span>!</span><p>{askError}</p><button type="button" onClick={() => void submit()}>{lang === "en" ? "Try again" : "다시 시도"}</button></div>}
          {answer && !panelOpen && !loading && <button type="button" className="expand-button reopen" onClick={() => {setPanelOpen(true); setAskOpen(false);}}>⤢ {t.reopenAnswer}</button>}
        </form>
      </div>}

      {panelOpen && answer && <div
        className={`answer-panel glass-card${isDocked ? " docked" : ""}`}
        ref={panelRef}
        role="dialog"
        aria-label={t.guide}
        style={!isDocked && panelPos ? { left: panelPos.x, top: panelPos.y, transform: "none" } : undefined}
      >
        <div className="answer-panel-head" onPointerDown={startPanelDrag}>
          <button type="button" className={starred ? "star-button on" : "star-button"} aria-pressed={starred} aria-label={starred ? t.starSaved : t.starSave} title={starred ? t.starSaved : t.starSave} onClick={toggleStar}>{starred ? "★" : "☆"}</button>
          <b>⌁ {t.guide}</b>
          <span className={usedWeb ? "web-badge" : "kb-badge"}>{usedWeb ? `✓ ${t.webChecked}` : `✓ ${t.knowledgeChecked}`}</span>
          {!isDocked && <small className="panel-hint">{t.panelHint}</small>}
          <button type="button" className="dock-button" aria-label={isDocked ? t.floatLabel : t.dockLabel} title={isDocked ? t.floatLabel : t.dockLabel} onClick={toggleDock}>{isDocked ? "⧉" : "⇥"}</button>
          <button type="button" aria-label={t.close} onClick={() => setPanelOpen(false)}>✕</button>
        </div>
        <div className="answer-panel-body">
          {question && <p className="asked-question"><span>{t.askedLabel}</span>{question}</p>}
          <MarkdownAnswer text={answer}/>
          {checkedAt && <small className="panel-checked">{t.checked}: {new Date(checkedAt).toLocaleString(lang === "ko" ? "ko-KR" : "en-US")}</small>}
          {citations.length > 0 && <div className="source-list"><strong>{t.sources}</strong>{citations.map((source, i) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{i + 1}</span><div><b>{source.title}</b><small>{new URL(source.url).hostname}</small></div><i>↗</i></a>)}</div>}
        </div>
        <span className="resize-corner" aria-hidden="true">⟓</span>
      </div>}

      {activeContent === "explore" && <>
        <section className="hero-copy">
          <p>{t.eyebrow}</p>
          <h1>{t.titleA}<br/><span>{t.titleB}</span></h1>
          <div>{t.intro}</div>
        </section>

        <section className="explorer" aria-label="AI knowledge explorer">
          <aside className="timeline-rail glass-card">
            <div className="panel-kicker">{t.history}</div><p>{t.historySub}</p>
            <div className="mini-timeline">
              {timeline.slice(0,5).map((item, i) => <div key={item[0]} className={expandedEra === i ? "era open" : "era"}>
                <button onClick={() => setExpandedEra(expandedEra === i ? null : i)} aria-expanded={expandedEra === i}><i className={`dot d${i} pulse`}/><span><b>{item[0]}</b><small>{lang === "en" ? item[1] : item[2]}</small></span></button>
                {expandedEra === i && <p className="era-detail">{lang === "en" ? timelineDetails[i][0] : timelineDetails[i][1]}</p>}
              </div>)}
            </div>
            <button className="soft-button" onClick={() => setSection("timeline")}>{lang === "en" ? "View full timeline" : "전체 역사 보기"} <span>→</span></button>
          </aside>

          <div className="knowledge-stage">
            <div className="map-heading"><span>{t.mapLabel}</span><b>{t.mapTitle}</b></div>
            <div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit orbit-c"/>
            <div className="celestial" aria-hidden="true">
              <span className="core-glow"/>
              <div className="planet-ring pr-a"><i className="planet p-cyan"/></div>
              <div className="planet-ring pr-b"><i className="planet p-violet"/><i className="planet p-small"/></div>
              <div className="planet-ring pr-c"><i className="planet p-gold"/></div>
            </div>
            <div className="topic-orbit">
              {topics.map((item, i) => <button key={item.id} className={`topic-node node-${i} ${selected.id === item.id ? "selected" : ""}`} onClick={e => selectTopic(item, e.currentTarget)}>
                <span className={`node-icon ${item.color}`}>{item.icon}</span><b>{title(item)}</b><small>{description(item)}</small>
              </button>)}
            </div>
          </div>

          <aside className="guide-column">
            <button type="button" className="guide-card glass-card clickable" onClick={() => setAskOpen(true)} aria-label={t.question}><div><span className="status-dot"/>{t.guide}<em>Beta</em></div><div className="bot"><span className="antenna a1"/><span className="antenna a2"/><b>⌁</b></div><p>{t.guideText}</p><span className="guide-cta">✦ {t.askChip} →</span></button>
            <div className="trust-card glass-card"><span>✓</span><div><b>{lang === "en" ? "Evidence-aware" : "근거 중심 정보"}</b><p>{t.noNews}</p></div></div>
          </aside>
        </section>

        <section ref={stripRef} className={`selected-strip glass-card${stripFlash ? " flash" : ""}`} aria-live="polite">
          <span className={`node-icon ${selected.color}`}>{selected.icon}</span>
          <div><small>{t.selected} · {t.established}</small><b>{title(selected)}</b><p>{description(selected)}</p></div>
          <div className="level"><span>{t.level}</span>{t.levels.map((l,i)=><button key={l} className={level===i?"active":""} onClick={()=>setLevel(i)}>{l}</button>)}</div>
          <button className="primary-button" onClick={() => {const q = lang === "en" ? `Explain ${selected.en}` : `${selected.ko}을 설명해 주세요`; window.scrollTo({top:200,behavior:"smooth"}); void submit(undefined, q);}}>{t.askAbout} →</button>
        </section>

        <section id="topic-grid" className="quick-section">
          <div className="section-head"><div><span>{lang === "en" ? "EXPLORE BY TOPIC" : "주제별 탐색"}</span><h2>{lang === "en" ? "Build your own path through AI" : "나만의 AI 학습 경로를 만들어 보세요"}</h2></div><p>{lang === "en" ? "Every concept connects to its history, uses, careers, risks and future." : "모든 개념은 역사·활용·직무·위험·미래와 연결됩니다."}</p></div>
          <div className="progress-card glass-card">
            <div className="progress-top">
              <div><span className="progress-label">✦ {t.progressTitle}</span><p>{t.progressHint}</p></div>
              <b className="progress-percent">{progressPercent}<i>%</i></b>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={t.progressTitle}>
              <span className="progress-fill" style={{width: `${progressPercent}%`}}/>
            </div>
            <small>{doneSteps} / {totalSteps} {t.progressSteps}{user && <em className="sync-note"> · ✓ {t.synced}</em>}</small>
          </div>
          <div className="topic-grid">{topics.map(item => <button key={item.id} onClick={() => {setSelected(item); window.scrollTo({top:300,behavior:"smooth"});}}><span className={`node-icon ${item.color}`}>{item.icon}</span><div><b>{title(item)}</b><p>{description(item)}</p><span className="level-dots">{[0,1,2].map(levelIndex => <i key={levelIndex} className={studyProgress[`${item.id}:${levelIndex}`] ? "done" : ""} title={t.levels[levelIndex]}/>)}</span></div><i>↗</i></button>)}</div>
        </section>
      </>}

      {activeContent !== "explore" && <section className="content-page">
        <button className="back" onClick={() => setSection("explore")}>← {lang === "en" ? "Back to the universe" : "전체 지도로 돌아가기"}</button>
        {activeContent === "learn" && <><div className="page-intro"><span>LEARNING PATHS</span><h1>{lang === "en" ? "Learn AI in the right order." : "AI를 올바른 순서로 배우세요."}</h1><p>{lang === "en" ? "A guided path from first principles to practical applications — at your pace." : "기초 원리부터 실제 활용까지, 나의 속도에 맞춘 단계형 학습 과정입니다."}</p></div><div className="learning-grid">{learningCards.map((c, i)=><article key={c[0]} className={activeModuleId === `learn-${i}` ? "active" : ""}><span>{c[0]}</span><h2>{lang === "en" ? c[1] : c[2]}</h2><p>{lang === "en" ? c[3] : c[4]}</p><button onClick={() => setActiveModuleId(activeModuleId === `learn-${i}` ? null : `learn-${i}`)}>{lang === "en" ? "Start module" : "학습 시작"} →</button></article>)}</div>{activeModuleId?.startsWith("learn-") && robotDashboard()}</>}
        {activeContent === "timeline" && <><div className="page-intro"><span>PAST · PRESENT · FUTURE</span><h1>{lang === "en" ? "The story of artificial intelligence" : "인공지능이 걸어온 길"}</h1><p>{lang === "en" ? "Progress was never a straight line. Explore the breakthroughs, winters and turning points." : "AI의 발전은 직선이 아니었습니다. 도약과 침체, 중요한 전환점을 살펴보세요."}</p></div><div className="full-timeline">{timeline.map((e,i)=><article key={e[0]}><i/><time>{e[0]}</time><div><span>{i < 5 ? t.established : (lang === "en" ? "Evolving" : "변화 중")}</span><h2>{lang === "en" ? e[1] : e[2]}</h2></div></article>)}</div></>}
        {activeContent === "careers" && <><div className="page-intro"><span>ROLES & CAREERS</span><h1>{lang === "en" ? "Find your place in the AI ecosystem." : "AI 생태계에서 나의 자리를 찾아보세요."}</h1><p>{lang === "en" ? "AI needs researchers, builders, communicators, designers and responsible decision-makers." : "AI에는 연구자·개발자·기획자·디자이너·책임 있는 의사결정자가 모두 필요합니다."}</p></div><div className="role-grid">{roles.map((r,i)=><article key={r[0]} className={activeModuleId === `career-${i}` ? "active" : ""}><span>0{i+1}</span><h2>{lang === "en" ? r[0] : r[1]}</h2><p>{lang === "en" ? r[2] : r[3]}</p><button onClick={() => setActiveModuleId(activeModuleId === `career-${i}` ? null : `career-${i}`)}>{lang === "en" ? "Explore role" : "직무 알아보기"} →</button></article>)}</div>{activeModuleId?.startsWith("career-") && robotDashboard()}</>}
        {activeContent === "resources" && <>
          <div className="page-intro"><span>TRUSTED STARTING POINTS</span><h1>{lang === "en" ? "Resources for deeper learning" : "더 깊은 학습을 위한 자료"}</h1><p>{lang === "en" ? "A structured index for concepts, practical skills and responsible AI." : "개념·실무 능력·책임 있는 AI를 위한 체계적인 자료 모음입니다."}</p></div>
          <div className="resource-sections">

            <section className="resource-block glass-card">
              <div className="resource-head"><span className="node-icon blue">Aa</span><div><h2>{t.glossaryTitle}</h2><p>{t.glossaryHint}</p></div></div>
              <input className="resource-search" type="search" value={glossQuery} onChange={e => setGlossQuery(e.target.value)} placeholder={t.searchPh} aria-label={`${t.glossaryTitle} ${t.searchPh}`}/>
              {(() => {
                const q = glossQuery.trim().toLowerCase();
                const filtered = glossary.filter(g => !q || g.term.toLowerCase().includes(q) || g.ko.includes(glossQuery.trim()) || g.enD.toLowerCase().includes(q) || g.koD.includes(glossQuery.trim()));
                const open = glossary.find(g => g.term === openTerm);
                return <>
                  <div className="term-chips">{filtered.map(g => <button key={g.term} className={openTerm === g.term ? "term-chip active" : "term-chip"} onClick={() => setOpenTerm(openTerm === g.term ? null : g.term)}>{g.term}{lang === "ko" && g.ko !== g.term ? <small> · {g.ko}</small> : null}</button>)}</div>
                  {filtered.length === 0 && <p className="no-result">{t.noResult}</p>}
                  {open && (filtered.some(g => g.term === open.term)) && <div className="term-detail">
                    <b>{open.term}{lang === "ko" && open.ko !== open.term ? ` (${open.ko})` : ""}</b>
                    <p>{lang === "en" ? open.enD : open.koD}</p>
                    <button className="primary-button" onClick={() => askFromPage(lang === "en" ? `Explain "${open.term}" in plain language with a real-life example.` : `"${open.term}(${open.ko})"을(를) 일상 예시와 함께 쉽게 설명해 주세요.`)}>{t.askMore} →</button>
                  </div>}
                </>;
              })()}
            </section>

            <section className="resource-block glass-card">
              <div className="resource-head"><span className="node-icon mint">⌘</span><div><h2>{t.guidesTitle}</h2><p>{t.guidesHint}</p></div></div>
              <input className="resource-search" type="search" value={guideQuery} onChange={e => setGuideQuery(e.target.value)} placeholder={t.searchPh} aria-label={`${t.guidesTitle} ${t.searchPh}`}/>
              {(() => {
                const q = guideQuery.trim().toLowerCase();
                const filtered = practicalGuides.filter(g => !q || g[0].toLowerCase().includes(q) || g[1].includes(guideQuery.trim()));
                return <>
                  <div className="term-chips">{filtered.map(g => <button key={g[0]} className="term-chip topic" onClick={() => askFromPage(lang === "en" ? `Give me a practical step-by-step guide: ${g[0]}.` : `실용적인 단계별 가이드를 알려 주세요: ${g[1]}.`)}>{lang === "en" ? g[0] : g[1]}<i>→</i></button>)}</div>
                  {filtered.length === 0 && <p className="no-result">{t.noResult}</p>}
                </>;
              })()}
            </section>

            <section className="resource-block glass-card">
              <div className="resource-head"><span className="node-icon rose">◇</span><div><h2>{t.safetyTitle}</h2><p>{t.safetyHint}</p></div></div>
              <input className="resource-search" type="search" value={safetyQuery} onChange={e => setSafetyQuery(e.target.value)} placeholder={t.searchPh} aria-label={`${t.safetyTitle} ${t.searchPh}`}/>
              {(() => {
                const q = safetyQuery.trim().toLowerCase();
                const filtered = safetyTopics.filter(g => !q || g[0].toLowerCase().includes(q) || g[1].includes(safetyQuery.trim()));
                return <>
                  <div className="term-chips">{filtered.map(g => <button key={g[0]} className="term-chip topic" onClick={() => askFromPage(lang === "en" ? `Explain for everyday users: ${g[0]}. Include practical tips.` : `일반 사용자 눈높이로 설명해 주세요: ${g[1]}. 실천 팁도 함께요.`)}>{lang === "en" ? g[0] : g[1]}<i>→</i></button>)}</div>
                  {filtered.length === 0 && <p className="no-result">{t.noResult}</p>}
                </>;
              })()}
            </section>

          </div>
        </>}
      </section>}

      <footer><div className="brand-mark small">A<span>I</span></div><p>{t.footer}</p><span>AI Universe · 2026</span></footer>
    </main>
  );
}
