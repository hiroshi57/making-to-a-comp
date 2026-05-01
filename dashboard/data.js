// ============================================================
//  Mock Data — making-to-a-comp Dashboard
//  Replace with real API calls when backend is ready
// ============================================================

const COMPANY = {
  name: "TBD Inc.",
  nameJa: "（社名未定）株式会社",
  location: "東京都渋谷区",
  since: "2024",
};

// ── KPI Summary ──────────────────────────────────────────────
const KPI = {
  revenue:     { value: 12_840_000, prev: 10_200_000, unit: "¥", label: "累計売上" },
  orders:      { value: 47,         prev: 38,          unit: "件", label: "受注件数" },
  costs:       { value: 5_320_000,  prev: 4_890_000,   unit: "¥", label: "総コスト" },
  profit:      { value: 7_520_000,  prev: 5_310_000,   unit: "¥", label: "利益" },
  clients:     { value: 23,         prev: 17,          unit: "社", label: "取引先数" },
  agentRuns:   { value: 184,        prev: 97,          unit: "回", label: "AI実行数" },
};

// ── Monthly Trend (12 months) ─────────────────────────────────
const MONTHLY = {
  labels: ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"],
  revenue: [620, 780, 850, 1020, 940, 1180, 1050, 1240, 1380, 1520, 1640, 1870],  // 万円
  costs:   [310, 380, 400, 450,  420, 510,  470,  530,  560,  610,  640,  680],   // 万円
  orders:  [2,   3,   3,   4,    3,   5,    4,    5,    5,    6,    7,    8],
};

// ── TimesFM Forecast (next 6 months) ─────────────────────────
const FORECAST = {
  labels: ["4月", "5月", "6月", "7月", "8月", "9月"],
  revenue: [2050, 2230, 2410, 2580, 2750, 2920],   // 万円（予測）
  lower:   [1820, 1970, 2100, 2240, 2380, 2510],   // 下限 (10th percentile)
  upper:   [2280, 2490, 2720, 2920, 3120, 3330],   // 上限 (90th percentile)
};

// ── Employees ─────────────────────────────────────────────────
const EMPLOYEES = [
  {
    id: "EMP001", role: "CEO", roleJa: "最高経営責任者",
    name: "田中 誠", nameEn: "Makoto Tanaka",
    dept: "経営", email: "ceo@company.jp",
    age: 38, joined: "2024-01",
    avatarBg: ["#5856d6","#af52de"],   // グラデーション用
    emoji: "🧭",
    personality: ["ビジョナリー", "決断力", "カリスマ"],
    tags: ["元コンサル", "連続起業家", "TEDx登壇"],
    skills: { 戦略: 95, リーダーシップ: 92, 営業: 78, 技術: 42, 財務: 70 },
    merit:  ["ビジョンの明確さが組織を束ねる", "危機時の判断が速い", "投資家との信頼関係が厚い"],
    demerit:["細部の詰めが甘くなることがある", "現場の温度感が掴みにくい"],
    dream:  "AIで中小企業のマーケを民主化し、2030年までに日本一のAIマーケ会社にする",
    contribution: [55, 62, 70, 80, 75, 90, 82, 95, 105, 115, 128, 148],  // 万円/月
    quote: "「正しい方向に全力で走る集団でありたい」",
  },
  {
    id: "EMP002", role: "CMO", roleJa: "マーケティング責任者",
    name: "山田 花子", nameEn: "Hanako Yamada",
    dept: "マーケティング", email: "marketing@company.jp",
    age: 32, joined: "2024-02",
    avatarBg: ["#ff2d55","#ff9500"],
    emoji: "📊",
    personality: ["データドリブン", "クリエイティブ", "好奇心旺盛"],
    tags: ["元Google", "広告運用歴8年", "MBA取得"],
    skills: { 戦略: 85, データ分析: 92, クリエイティブ: 88, 営業: 60, 技術: 55 },
    merit:  ["KPIへの執着が強くROIを常に最適化", "クリエイティブと数字を両立できる稀有な人材", "チームのモチベーション管理が上手い"],
    demerit:["完璧主義でリリースが遅れることがある", "予算交渉で強気になりすぎる"],
    dream:  "世界市場で通用する日本初のAIマーケブランドを作る。いつかNYでオフィスを持ちたい",
    contribution: [42, 58, 65, 80, 72, 96, 88, 102, 118, 130, 145, 162],
    quote: "「数字は嘘をつかない。でも数字だけでは人は動かない」",
  },
  {
    id: "EMP003", role: "Sales", roleJa: "営業部長",
    name: "鈴木 一郎", nameEn: "Ichiro Suzuki",
    dept: "営業", email: "sales@company.jp",
    age: 35, joined: "2024-02",
    avatarBg: ["#007aff","#30d158"],
    emoji: "🤝",
    personality: ["人たらし", "行動力", "負けず嫌い"],
    tags: ["元野村証券", "受注額累計3億超", "ゴルフ好き"],
    skills: { 営業: 96, 交渉: 92, リレーション: 90, 戦略: 65, 技術: 30 },
    merit:  ["初回アポから契約まで平均3週間という驚異のスピード", "顧客との長期関係構築が得意", "断られても諦めない粘り強さ"],
    demerit:["社内報告が後回しになりがち", "システム・ツールへの適応が遅い"],
    dream:  "30社の顧客を100社にして、自分のチームを持つ営業部を作る",
    contribution: [38, 50, 60, 72, 65, 84, 76, 90, 100, 112, 122, 138],
    quote: "「受注は信頼の結果。信頼は時間の結果」",
  },
  {
    id: "EMP004", role: "CS", roleJa: "カスタマーサポート責任者",
    name: "佐藤 美咲", nameEn: "Misaki Sato",
    dept: "カスタマーサポート", email: "support@company.jp",
    age: 28, joined: "2024-03",
    avatarBg: ["#30d158","#007aff"],
    emoji: "💬",
    personality: ["共感力高い", "丁寧", "縁の下の力持ち"],
    tags: ["NPS向上のプロ", "顧客解約率0.8%維持", "心理学出身"],
    skills: { 顧客対応: 95, 共感力: 98, 分析: 72, 営業: 55, 技術: 45 },
    merit:  ["顧客の不満を先読みして予防する能力が突出", "解約阻止率が業界平均の3倍", "ポジティブな口コミを生む接客術"],
    demerit:["自分を犠牲にして働きすぎる傾向", "ノーと言えないため業務過多になる"],
    dream:  "CSをコストセンターからプロフィットセンターに変える。将来は自分のCS代理店を持ちたい",
    contribution: [18, 22, 25, 30, 28, 35, 32, 38, 42, 46, 50, 55],
    quote: "「お客様の『ありがとう』が、私の全部のエネルギーになる」",
  },
  {
    id: "EMP005", role: "CTO", roleJa: "最高技術責任者",
    name: "高橋 健", nameEn: "Ken Takahashi",
    dept: "エンジニアリング", email: "dev@company.jp",
    age: 36, joined: "2024-01",
    avatarBg: ["#ff9500","#ff2d55"],
    emoji: "⚙️",
    personality: ["職人気質", "論理的", "完璧主義"],
    tags: ["東大CS", "OSS貢献歴10年", "Rust使い"],
    skills: { 技術: 98, アーキテクチャ: 95, AI/ML: 88, マネジメント: 62, 営業: 20 },
    merit:  ["コード品質への妥協がなくバグ率が極めて低い", "AIパイプラインの設計力は国内トップクラス", "ドキュメントが神がかり的に丁寧"],
    demerit:["ビジネス側との翻訳コストが高い", "理想を追いすぎてデリバリーが遅れることがある"],
    dream:  "日本発のAIエージェント基盤をOSSで世界標準にする。GitHubスター10万を目指す",
    contribution: [30, 35, 40, 48, 44, 55, 50, 60, 65, 72, 78, 88],
    quote: "「動くコードが最高の仕様書だ」",
  },
  {
    id: "EMP006", role: "Legal", roleJa: "法務責任者",
    name: "伊藤 法人", nameEn: "Hojin Ito",
    dept: "法務", email: "legal@company.jp",
    age: 40, joined: "2024-03",
    avatarBg: ["#636366","#48484a"],
    emoji: "⚖️",
    personality: ["慎重派", "論理的", "守護者"],
    tags: ["元弁護士事務所", "IT法務10年", "スタートアップ専門"],
    skills: { 法律知識: 96, リスク管理: 92, 交渉: 80, ビジネス理解: 75, 技術: 38 },
    merit:  ["契約の抜け穴を見つける精度が業界屈指", "スタートアップのスピードを理解した現実的な対応", "規制変化のキャッチアップが早い"],
    demerit:["リスク回避姿勢が強すぎてビジネスにブレーキになることがある", "専門用語が多く非専門家には伝わりにくい"],
    dream:  "AI法務の標準を作る。テクノロジー企業が安心して挑戦できる法的基盤を整備したい",
    contribution: [8, 10, 12, 14, 12, 16, 14, 18, 20, 22, 24, 26],
    quote: "「リスクを取るためにリスクを知る。それが法務の本質」",
  },
  {
    id: "EMP007", role: "CFO", roleJa: "最高財務責任者",
    name: "中村 会計", nameEn: "Kaikei Nakamura",
    dept: "経理・財務", email: "accounting@company.jp",
    age: 42, joined: "2024-01",
    avatarBg: ["#af52de","#5856d6"],
    emoji: "💰",
    personality: ["几帳面", "保守的", "信頼の要"],
    tags: ["公認会計士", "元Big4", "M&A経験あり"],
    skills: { 財務: 97, 会計: 96, 資金調達: 82, 戦略: 70, 技術: 28 },
    merit:  ["キャッシュフロー管理が精緻でサプライズがゼロ", "投資家向けレポートのクオリティが高く信頼を獲得", "コスト削減の嗅覚が鋭い"],
    demerit:["数字に厳しすぎて新規投資に慎重すぎる", "スタートアップのスピードに慣れるまで時間がかかった"],
    dream:  "IPOを経験し、日本のスタートアップエコシステムの財務水準を底上げしたい",
    contribution: [12, 14, 16, 18, 16, 20, 18, 22, 24, 26, 28, 30],
    quote: "「数字の背後にある経営判断を支えるのが、私の存在意義」",
  },
  {
    id: "EMP008", role: "HR", roleJa: "人事・採用責任者",
    name: "小林 人事", nameEn: "Jinji Kobayashi",
    dept: "人事・採用", email: "hr@company.jp",
    age: 30, joined: "2024-02",
    avatarBg: ["#ff2d55","#5856d6"],
    emoji: "🌱",
    personality: ["聞き上手", "人間観察好き", "明るい"],
    tags: ["元リクルート", "採用決定率42%", "ピープルマネジメント専門"],
    skills: { 採用: 90, 組織設計: 82, コミュニケーション: 95, 戦略: 65, 技術: 35 },
    merit:  ["候補者の本質を見抜く面接力が高い", "カルチャーフィットの判断精度がトップクラス", "入社後の定着率が高い採用を実現"],
    demerit:["採用基準が高すぎて充足に時間がかかることがある", "人に優しすぎて評価時に甘くなる"],
    dream:  "「働くことが人生最高の喜び」と言える組織を作る。将来は人事コンサルとして独立したい",
    contribution: [10, 12, 14, 16, 14, 18, 16, 20, 22, 24, 26, 28],
    quote: "「人が変われば、会社が変わる。会社が変われば、世界が変わる」",
  },
];

// ── Agent Pipeline Log ────────────────────────────────────────
const AGENT_LOG = [
  { ts:"2026-04-10 14:32", task:"競合分析レポート", agents:["Planner","MarketAnalyst","Integrator"], status:"completed", score:0.91 },
  { ts:"2026-04-10 11:18", task:"SNS広告プラン作成", agents:["Planner","InsightAgent","StrategyAgent","Integrator"], status:"completed", score:0.88 },
  { ts:"2026-04-09 16:45", task:"ターゲットセグメント定義", agents:["Planner","MarketAnalyst","InsightAgent"], status:"completed", score:0.85 },
  { ts:"2026-04-09 09:20", task:"Q2 KPI設定", agents:["Planner","StrategyAgent","Integrator"], status:"completed", score:0.93 },
  { ts:"2026-04-08 17:10", task:"新規顧客向けコンテンツ戦略", agents:["Planner","InsightAgent","StrategyAgent","Integrator"], status:"completed", score:0.79 },
  { ts:"2026-04-08 13:55", task:"メールキャンペーン設計", agents:["Planner","StrategyAgent"], status:"failed",    score:0.42 },
  { ts:"2026-04-07 10:30", task:"市場規模推定", agents:["Planner","MarketAnalyst"], status:"completed", score:0.96 },
];

// ── SG&A 販売費及び一般管理費 ────────────────────────────────────
const SNGA = {
  // 当月合計
  total:    { value: 4_180_000, prev: 3_920_000, unit: "¥", label: "販管費合計" },
  ratio:    { value: 32.6,      prev: 38.4,       unit: "%", label: "売上比率" },

  // カテゴリ別（当月 万円）
  breakdown: [
    { label: "人件費",       amount: 2_100_000, color: "#5856d6", pct: 50.2 },
    { label: "広告宣伝費",   amount:   620_000, color: "#007aff", pct: 14.8 },
    { label: "賃借料",       amount:   480_000, color: "#30d158", pct: 11.5 },
    { label: "外注費",       amount:   380_000, color: "#ff9500", pct:  9.1 },
    { label: "通信費",       amount:   210_000, color: "#af52de", pct:  5.0 },
    { label: "旅費交通費",   amount:   180_000, color: "#ff2d55", pct:  4.3 },
    { label: "消耗品・その他", amount:  210_000, color: "#8e8e93", pct:  5.0 },
  ],

  // 月次推移（万円）
  monthly: {
    labels:    ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"],
    personnel: [190, 195, 200, 205, 205, 210, 210, 215, 215, 205, 208, 210],  // 人件費
    ad:        [ 40,  52,  58,  70,  62,  80,  72,  85,  92, 100, 108, 120],  // 広告宣伝費
    rent:      [ 48,  48,  48,  48,  48,  48,  48,  48,  48,  48,  48,  48],  // 賃借料
    other:     [ 32,  38,  42,  48,  44,  55,  50,  60,  65,  72,  76,  80],  // その他
  },
};

// ── Orders ────────────────────────────────────────────────────
const ORDERS = [
  { id:"ORD-047", client:"株式会社テックスタート", amount:1_200_000, date:"2026-04-09", status:"受注", agent:"CMO" },
  { id:"ORD-046", client:"グリーンウェイ合同会社",  amount:  850_000, date:"2026-04-08", status:"請求済", agent:"Sales" },
  { id:"ORD-045", client:"フューチャーネット株式会社", amount:2_400_000, date:"2026-04-05", status:"入金済", agent:"CMO" },
  { id:"ORD-044", client:"クリエイティブラボ",     amount:  680_000, date:"2026-04-03", status:"入金済", agent:"Sales" },
  { id:"ORD-043", client:"マーケットプラス株式会社", amount:1_550_000, date:"2026-03-28", status:"入金済", agent:"CMO" },
];
