/* ==========================================================================
   jobs-data.js - AImeシップ求人データ (original.html / job.html / search.html 共通)
   ========================================================================== */
window.JOBS_DATA = {
  llm: [
    {company:'株式会社ニューロンクラフト',band:'Pickup',badge:'Pickup',title:'【GPTの裏側を知りたくないか？】自社LLMを開発中のスタートアップで、RAG構築からファインチューニングまで全部やる。',tags:['GPU使い放題','自社LLM開発','フルリモート可','未経験OK'],salary:'2,000〜4,000円',location:'渋谷駅 徒歩5分',workdays:'週3〜',about:'大規模言語モデル（LLM）の研究・開発を行うスタートアップ。創業2年でシリーズAを完了し、自社モデルの商用化を目指しています。インターン生も初日からプロダクションコードに触れ、研究開発の最前線を体験できます。',skills:['Python基礎','LLM / Transformer の基本理解','Git'],welcome:['Hugging Face 使用経験','RAG / LangChain / LlamaIndex 経験','Kaggle 入賞歴','論文実装経験'],benefits:['GPU（A100 / H100）使い放題','論文読み会（週1）','書籍購入補助（月1万円）','社内LT会','フルリモート可']},
    {company:'LLMラボ株式会社',title:'【LangChainマスターになれ】RAGパイプライン構築で、検索精度を極限まで高めるエンジニア募集。',tags:['RAG特化','LangChain','ベクトルDB','週3〜'],salary:'2,200〜3,800円',location:'目黒駅 徒歩7分',workdays:'週3〜',about:'企業向けRAGソリューションを提供するLLMスペシャリスト集団。顧客の検索体験を極限まで磨き上げるプロフェッショナルチーム。',skills:['Python','LangChain 使用経験','ベクトルDB の基本理解'],welcome:['Pinecone / Weaviate 経験','検索エンジン最適化経験'],benefits:['ベクトルDB 各種有料プラン使用可','技術書購入補助','海外カンファレンス派遣']},
    {company:'合同会社トークンAI',band:'急募',title:'【ファインチューニングの鬼になれ】自社LLMのチューニングで、GPT-4超えを本気で目指す。',tags:['ファインチューニング','Hugging Face','論文読み会','フルリモート'],salary:'2,500〜5,000円',location:'フルリモート',workdays:'週4〜',about:'自社オープンソースLLMの開発を行うチーム。ファインチューニングとアラインメントで競合と差別化を図ります。',skills:['Python / PyTorch','LLM の数学的基礎','論文読解力'],welcome:['SFT / DPO / RLHF 経験','分散学習経験','論文執筆経験'],benefits:['H100 クラスタ使い放題','論文共著の機会','国際学会派遣','フルリモート']},
    {company:'株式会社ベクトルサーチ',badge:'new',badgeNew:true,title:'【埋め込みベクトルの世界へ】セマンティック検索エンジンを開発。情報検索の未来を作るLLMエンジニア。',tags:['検索AI','Embedding','Pinecone','週4〜'],salary:'2,000〜3,500円',location:'五反田駅 徒歩3分',workdays:'週4〜',about:'次世代セマンティック検索エンジンの開発。Embedding とベクトル近傍探索の最適化で、検索精度と速度を両立させます。',skills:['Python','機械学習の基礎'],welcome:['Elasticsearch / Solr 経験','情報検索論文の読解'],benefits:['GPU 予算月10万円','技術書購入補助','フレックス制']},
    {company:'AIネイティブ株式会社',title:'【GPTsの次を作れ】カスタムLLMエージェントのプラットフォーム開発。API設計からUI/UXまで。',tags:['LLMプラットフォーム','API設計','TypeScript','シリーズA'],salary:'2,300〜4,500円',location:'恵比寿駅 徒歩5分',workdays:'週3〜',about:'非エンジニアでもカスタムAIエージェントを作れるノーコードプラットフォームを開発。誰もがAIを使える世界を目指しています。',skills:['TypeScript / React','REST API の理解'],welcome:['Next.js / tRPC 経験','UI/UX デザイン経験'],benefits:['Figma / 各種ツール会社負担','ストックオプション','副業OK']},
    {company:'株式会社マルチモーダルAI',title:'【テキストだけじゃない】画像+テキストのマルチモーダルLLM開発。最先端の研究をプロダクトに。',tags:['マルチモーダル','Vision API','研究開発','論文共著'],salary:'2,800〜5,500円',location:'本郷三丁目駅 徒歩8分',workdays:'週4〜',about:'画像・音声・テキストを統合するマルチモーダル基盤モデルの研究開発。東大との共同研究プロジェクトを多数保有。',skills:['Python / PyTorch','Computer Vision の基礎'],welcome:['CLIP / LLaVA 経験','論文読解・実装経験'],benefits:['H100 クラスタ使い放題','論文共著の機会','東大との共同研究参加']},
  ],
  prompt: [
    {company:'合同会社プロンプト・ラボ',band:'激レア枠 - 急募',title:'【日本語力、最強の武器になる】英語圏のプロンプトエンジニアに日本語で殴り込み。文系こそ来い。',tags:['文系歓迎','プログラミング不要','CEO直下','フルリモート'],salary:'1,800〜3,000円',location:'完全フルリモート',workdays:'週3〜',about:'日本語に特化したプロンプト研究・最適化を行うラボ。英語圏では気づけない日本語独自のプロンプト最適化で市場を取りに行きます。',skills:['高い日本語読解・作文能力','論理的思考力'],welcome:['英語でのドキュメント読解','ChatGPT / Claude 使用経験'],benefits:['CEO直下の裁量','完全フルリモート','週3〜OK','書籍購入補助']},
    {company:'株式会社プロンプトデザイン',title:'【言葉でAIを操る職人】企業向けプロンプト設計・最適化コンサルタント。',tags:['コンサル','プロンプト設計','業務効率化','副業OK'],salary:'2,000〜3,500円',location:'品川駅 徒歩4分',workdays:'週3〜',about:'大手企業のAI導入に伴うプロンプト設計を請け負う専門チーム。業務効率化の最前線。',skills:['文章構造化能力','業務理解力'],welcome:['コンサル経験','業務改善経験'],benefits:['副業OK','週3〜','各種ツール会社負担']},
    {company:'AIライティング株式会社',badge:'new',badgeNew:true,title:'【AIコンテンツの品質を極めろ】プロンプトエンジニアリングで記事・広告の質を最大化。',tags:['コンテンツ','ライティング','文系歓迎','週2〜'],salary:'1,500〜2,800円',location:'渋谷駅 徒歩6分',workdays:'週2〜',about:'AIと人間のハイブリッドなコンテンツ制作会社。プロンプト設計で記事品質を工業製品レベルに底上げ。',skills:['日本語の書き言葉センス','締切を守る力'],welcome:['ライター経験','SEO 知識'],benefits:['週2〜','学生ライター多数','執筆案件マッチング']},
    {company:'合同会社チャットUX',title:'【会話設計のプロになれ】AIチャットボットの対話フロー設計。ユーザー体験を言葉で作る。',tags:['UX設計','チャットボット','フルリモート','未経験OK'],salary:'1,800〜3,200円',location:'フルリモート',workdays:'週3〜',about:'カスタマーサポート向けAIチャットボットの対話フロー設計。UXライティングとプロンプト設計の融合。',skills:['UX の基本知識','ユーザー視点'],welcome:['UX ライティング経験','ユーザーインタビュー経験'],benefits:['フルリモート','フレックス','学習費補助']},
    {company:'プロンプトファクトリー株式会社',band:'文系最強ポジション',title:'【プロンプトのプロを育成】体系的な研修あり。AI時代の新職種を最前線で学ぶ。',tags:['研修充実','メンター制度','文系歓迎','1年生OK'],salary:'1,500〜2,500円',location:'新宿駅 徒歩5分',workdays:'週3〜',about:'プロンプトエンジニアの育成を業務化したスタートアップ。研修3週間で基礎から応用まで体系的に学べます。',skills:['学習意欲','基本的なPCスキル'],welcome:['AI への興味','文章を書くのが好き'],benefits:['研修3週間','1on1 メンター','書籍購入補助','1年生歓迎']},
  ],
  image: [
    {company:'株式会社ディフュージョン・ワークス',badge:'new',badgeNew:true,title:'【イラストレーターを敵に回す覚悟はあるか？】Stable Diffusion / Midjourney 時代のクリエイティブAI開発。',tags:['A100使い放題','美大生歓迎','一部リモート可','論文共著チャンス'],salary:'2,500〜5,000円',location:'六本木一丁目駅 徒歩3分',workdays:'週3〜',about:'画像生成AIのプロダクト開発をリードするクリエイティブAIスタジオ。美大生とエンジニアが同じチームで働く珍しい環境。',skills:['Python / PyTorch','画像の基礎知識'],welcome:['Stable Diffusion / ComfyUI 経験','Illustrator / Photoshop'],benefits:['A100 使い放題','美大生歓迎','論文共著チャンス','一部リモート']},
    {company:'株式会社ジェネレイト',title:'【ComfyUIの魔術師求む】ワークフロー構築で画像生成パイプラインを自動化するエンジニア。',tags:['ComfyUI','自動化','クリエイティブ','週3〜'],salary:'2,000〜4,000円',location:'中目黒駅 徒歩5分',workdays:'週3〜',about:'ComfyUI を基盤とした画像生成パイプラインの自動化。クリエイターの生産性を10倍にするツールを開発。',skills:['Python','画像処理の基礎'],welcome:['ComfyUI カスタムノード開発','ワークフロー設計経験'],benefits:['GPU 環境充実','リモート週2','技術書購入補助']},
    {company:'AIアートスタジオ株式会社',band:'アート×テック',title:'【AIで新しいアートを創れ】ControlNet/LoRA活用で企業向けクリエイティブを量産。',tags:['ControlNet','LoRA','美大生歓迎','ポートフォリオ'],salary:'2,200〜4,500円',location:'表参道駅 徒歩7分',workdays:'週3〜',about:'広告・出版向けのAIクリエイティブ制作を行うスタジオ。ControlNet と LoRA を駆使した高品質生成が強み。',skills:['画像編集ソフト','美術の基礎知識'],welcome:['ControlNet / LoRA カスタム経験','Photoshop 上級'],benefits:['ポートフォリオ支援','美大生歓迎','フレックス']},
    {company:'動画AI株式会社',badge:'new',badgeNew:true,title:'【動画生成AIの最前線】Sora/Runway世代の動画生成技術を商用プロダクトに実装。',tags:['動画生成','Sora','GPU環境','研究開発'],salary:'2,800〜5,000円',location:'渋谷駅 徒歩10分',workdays:'週4〜',about:'動画生成AIのパイオニア。Sora / Runway に対抗する国産動画生成モデルの研究・商用化。',skills:['Python / PyTorch','動画処理の基礎'],welcome:['Diffusion モデルの理論','動画編集ソフト'],benefits:['H100 クラスタ','論文共著','国際学会派遣']},
    {company:'株式会社テクスチャAI',title:'【3Dテクスチャ×AI】ゲーム・建築向けのAIテクスチャ生成ツールを開発するスタートアップ。',tags:['3D','ゲーム開発','Unity','リモート可'],salary:'2,000〜3,800円',location:'秋葉原駅 徒歩3分',workdays:'週3〜',about:'3DCG向けAIテクスチャ生成ツールを開発。ゲーム・建築ビジュアライゼーション業界向け。',skills:['3DCG の基礎','Python'],welcome:['Unity / Unreal 経験','Blender 経験'],benefits:['高性能マシン貸与','リモート週3','ゲーム制作参加可']},
  ],
  agent: [
    {company:'株式会社オートノミー',band:'注目度MAX - 話題の領域',badge:'Pickup',title:'【AIエージェントが人間の仕事を奪う？いや、お前が作る側だ。】自律型AIエージェントの開発。',tags:['自律型AI開発','H100クラスタ','シリーズB','CTO直下'],salary:'3,000〜6,000円',location:'渋谷駅 徒歩8分',workdays:'週3〜',about:'自律型AIエージェント基盤を開発。企業の業務プロセスを自動化するエージェント群を設計・実装。',skills:['Python','LLM の基礎','API 設計'],welcome:['LangChain / LangGraph','分散システム設計','Docker / K8s'],benefits:['H100 クラスタ','CTO直下','ストックオプション','論文共著']},
    {company:'エージェントラボ株式会社',title:'【マルチエージェントの世界】複数AIが協調して問題を解く、次世代システムの開発。',tags:['マルチエージェント','CrewAI','LangGraph','研究開発'],salary:'2,500〜5,000円',location:'目黒駅 徒歩6分',workdays:'週3〜',about:'マルチエージェントの協調問題解決に特化した研究開発チーム。複数のLLMが議論・交渉するシステムを構築。',skills:['Python','LLM API 使用経験'],welcome:['CrewAI / LangGraph','分散システム'],benefits:['論文共著','研究開発時間30%','技術書購入補助']},
    {company:'株式会社ツールユースAI',badge:'new',badgeNew:true,title:'【Tool UseでAIを進化させろ】外部ツール連携でAIの能力を100倍にする基盤開発。',tags:['Tool Use','Function Calling','API開発','フルリモート'],salary:'2,800〜5,500円',location:'フルリモート',workdays:'週4〜',about:'Tool Use / Function Calling の技術で、AIが外部ツールを使いこなす基盤を開発。',skills:['Python','API 設計'],welcome:['Function Calling 経験','プロトコル設計'],benefits:['フルリモート','フレックス','技術書購入補助']},
    {company:'合同会社AGIラボ',band:'シード期・裁量MAX',title:'【AGIへの第一歩】自己改善型AIエージェントの研究開発。世界を変えるチームへ。',tags:['AGI研究','自己改善AI','論文実績','少数精鋭'],salary:'3,000〜7,000円',location:'本郷三丁目駅 徒歩5分',workdays:'週4〜',about:'AGI を真面目に目指すシード期スタートアップ。自己改善型エージェントの研究開発。',skills:['Python','機械学習の理論'],welcome:['論文実績','強化学習経験'],benefits:['裁量MAX','論文執筆可','ストックオプション']},
  ],
  medical: [
    {company:'MedAI株式会社',title:'【AIで命を救う。マジで。】医療画像診断AIの開発。東大医学部との共同研究プロジェクト。',tags:['社会貢献ガチ勢','東大共同研究','論文共著','理系推奨'],salary:'2,000〜3,500円',location:'本郷三丁目駅 徒歩5分',workdays:'週3〜',about:'医療画像診断AIの社会実装を行う医工連携スタートアップ。東大医学部との共同研究。',skills:['Python','機械学習の基礎'],welcome:['医療画像処理','DICOM'],benefits:['東大との共同研究','論文共著','社会貢献']},
    {company:'ヘルスケアAI株式会社',badge:'new',badgeNew:true,title:'【創薬×AI】新薬開発を加速するAIモデルの構築。バイオ×機械学習の最前線。',tags:['創薬AI','バイオインフォ','Python','週3〜'],salary:'2,200〜4,000円',location:'日本橋駅 徒歩3分',workdays:'週3〜',about:'AIを使った創薬プロセスの効率化。バイオインフォマティクスと機械学習の融合。',skills:['Python','化学・生物の基礎'],welcome:['RDKit','AlphaFold'],benefits:['研究時間50%','論文共著','社会貢献']},
    {company:'メディカルビジョン株式会社',band:'社会貢献',title:'【内視鏡AI】リアルタイム画像解析で医師の診断を支援するAIシステム開発。',tags:['画像認識','リアルタイム','医療機器','出社メイン'],salary:'2,500〜4,500円',location:'御茶ノ水駅 徒歩7分',workdays:'週3〜',about:'内視鏡医療におけるリアルタイム診断支援AIの開発。医療機器認証済み。',skills:['Python / OpenCV','画像処理'],welcome:['リアルタイム処理','医療機器開発'],benefits:['医師とのディスカッション','医療機器開発経験','社会貢献']},
  ],
  robotics: [
    {company:'RoboMind株式会社',badge:'new',badgeNew:true,title:'【ソフトウェアに飽きたらハードで殴れ】具身化AI x ロボティクス。現実世界を動かすAIを作ろう。',tags:['ロボットあり','理系推奨','出社メイン','国際学会発表チャンス'],salary:'2,200〜4,000円',location:'大崎駅 徒歩10分',workdays:'週3〜',about:'具身化AI（Embodied AI）の研究開発。現実世界で動くロボットのための知能を開発。',skills:['Python','ROS の基礎'],welcome:['ROS2','強化学習'],benefits:['実機触り放題','国際学会発表','論文共著']},
    {company:'自動運転AI株式会社',title:'【公道を走るAI】自動運転レベル4を目指すスタートアップで、認識・判断モデル開発。',tags:['自動運転','LIDAR','シミュレーション','C++'],salary:'2,500〜5,000円',location:'お台場 徒歩8分',workdays:'週4〜',about:'自動運転レベル4を目指す次世代モビリティスタートアップ。認識・判断モデルの開発。',skills:['Python / C++','Computer Vision'],welcome:['LIDAR 処理','ROS / Autoware'],benefits:['実車テスト参加','シミュレーション環境','論文実装']},
    {company:'ドローンAI株式会社',band:'ハード×ソフト融合',title:'【空飛ぶAI】ドローン自律飛行のためのビジョンAI開発。農業・物流の未来を作る。',tags:['ドローン','ビジョンAI','ROS2','屋外実験'],salary:'2,000〜3,800円',location:'つくば 車通勤可',workdays:'週3〜',about:'農業・物流向けドローン自律飛行システムの開発。屋外実験多数。',skills:['Python','画像処理の基礎'],welcome:['ROS2','ドローン制御'],benefits:['屋外実験参加','実機触り放題','つくば勤務手当']},
  ],
  data: [
    {company:'データドリブン株式会社',band:'未経験から最速でAI人材へ',title:'【Excelで消耗するのはもうやめろ】pandas, SQL, 機械学習。「データ分析できます」を本物にする3ヶ月。',tags:['未経験OK','研修3週間','メンター制度','Kaggle推奨'],salary:'1,500〜2,500円',location:'新宿駅 徒歩7分',workdays:'週3〜',about:'未経験者をデータアナリストに育てる研修制度が強みの会社。3ヶ月で現場で戦える人材に。',skills:['Excel 基本操作','学習意欲'],welcome:['SQL 基礎','Python 入門'],benefits:['研修3週間','1on1 メンター','Kaggle 参加支援']},
    {company:'アナリティクスAI株式会社',title:'【データの海から宝を掘れ】BIダッシュボード構築 × 機械学習予測モデル開発。',tags:['BI','Tableau','SQL','週3〜'],salary:'1,800〜3,000円',location:'品川駅 徒歩5分',workdays:'週3〜',about:'BI と機械学習の両輪を回すデータ分析集団。企業の意思決定を支えるダッシュボード構築。',skills:['SQL','統計の基礎'],welcome:['Tableau / Looker','Python'],benefits:['BI ツール使い放題','フレックス','学習費補助']},
    {company:'株式会社MLパイプライン',badge:'new',badgeNew:true,title:'【MLOpsの実務を学べ】モデルの学習・デプロイ・監視まで一気通貫で経験できる。',tags:['MLOps','Docker','AWS','GCP'],salary:'2,000〜3,500円',location:'渋谷駅 徒歩8分',workdays:'週3〜',about:'MLOps に特化した受託開発。モデルを学習から運用まで一貫して扱える貴重なポジション。',skills:['Python','Git / GitHub'],welcome:['Docker','AWS / GCP'],benefits:['クラウド費用負担','資格取得支援','技術書購入補助']},
    {company:'需要予測AI株式会社',title:'【AIで在庫ロスをゼロに】小売・物流向け需要予測モデルの開発・改善。',tags:['需要予測','時系列分析','Python','リモート可'],salary:'1,800〜3,200円',location:'東京駅 徒歩3分',workdays:'週3〜',about:'小売・物流業界向けの需要予測SaaSを提供。時系列分析と機械学習のプロ。',skills:['Python / pandas','統計の基礎'],welcome:['時系列モデル','Prophet / statsmodels'],benefits:['リモート週2','フレックス','学習費補助']},
    {company:'コンペドリブン株式会社',band:'Kaggler歓迎',title:'【Kaggleの実力を仕事に活かせ】コンペ上位経験者優遇。実データで腕試し。',tags:['Kaggle','XGBoost','特徴量設計','成果報酬'],salary:'2,000〜4,000円',location:'フルリモート',workdays:'週3〜',about:'Kaggle 上位陣が集まるデータ分析集団。実データでの難問に取り組みたい人向け。',skills:['Python','機械学習の理論'],welcome:['Kaggle メダル','XGBoost / LightGBM'],benefits:['成果報酬','Kaggle 参加費支援','フルリモート']},
    {company:'株式会社データクレンジング',title:'【汚いデータと戦え】前処理・クレンジングのスペシャリスト育成。地味だが超重要。',tags:['データ前処理','ETL','SQL','未経験OK'],salary:'1,500〜2,500円',location:'池袋駅 徒歩6分',workdays:'週3〜',about:'データクレンジング / ETL に特化。「データの泥臭い処理」のプロフェッショナル集団。',skills:['SQL','Excel 中級'],welcome:['Python / pandas','ETL ツール'],benefits:['未経験歓迎','研修あり','週3〜OK']},
  ],
  business: [
    {company:'AIストラテジー株式会社',badge:'Pickup',title:'【コードが書けなくてもAI業界で天下取れる】AI製品のPMM / BizDev。市場価値バグり散らかし人材。',tags:['文系大歓迎','コード不要','CEO直下','インセンティブあり'],salary:'1,800〜3,500円',location:'表参道駅 徒歩3分',workdays:'週3〜',about:'AI プロダクトの事業開発・PMM を担う非技術職ポジション。CEO直下で市場戦略を描く。',skills:['論理的思考','コミュニケーション力'],welcome:['B2B SaaS 経験','事業開発経験'],benefits:['CEO直下','インセンティブ制','文系歓迎']},
    {company:'AIセールス株式会社',title:'【AI商材を売れる人材は最強】エンタープライズ向けAI SaaSの営業・CS。',tags:['営業','カスタマーサクセス','AI SaaS','インセンティブ'],salary:'1,500〜3,000円',location:'六本木駅 徒歩5分',workdays:'週3〜',about:'エンタープライズ向けAI SaaS の営業・カスタマーサクセス。AI商材を売る技術を身につける。',skills:['コミュ力','ロジカルシンキング'],welcome:['営業経験','AI / SaaS への興味'],benefits:['インセンティブ','研修制度','週3〜']},
    {company:'株式会社AIコンサル',band:'経営直下',title:'【AIで業務改革を提案せよ】大手企業のAI導入コンサルティング。戦略から実行まで。',tags:['コンサル','業務改革','プレゼン力','週3〜'],salary:'2,000〜4,000円',location:'丸の内 徒歩2分',workdays:'週3〜',about:'大手企業のAI導入を戦略から実行まで支援するコンサルティングファーム。',skills:['論理的思考','プレゼン力'],welcome:['コンサル経験','業務改革経験'],benefits:['経営直下','大手企業案件','高時給']},
    {company:'AI PR株式会社',badge:'new',badgeNew:true,title:'【AI企業のブランドを作れ】PR・マーケティングでAIスタートアップの認知を爆上げ。',tags:['PR','マーケティング','SNS運用','文系歓迎'],salary:'1,500〜2,800円',location:'渋谷駅 徒歩4分',workdays:'週3〜',about:'AIスタートアップのPR・マーケティングを専門に請け負う。ブランド構築の最前線。',skills:['文章力','SNS 運用'],welcome:['PR 経験','マーケティング経験'],benefits:['多様な案件','文系歓迎','フレックス']},
    {company:'株式会社AIリクルート',title:'【AIエンジニアを採れ】AI人材特化のリクルーター。技術を理解して最適マッチング。',tags:['採用','人事','AI業界理解','コミュ力'],salary:'1,500〜3,000円',location:'恵比寿駅 徒歩3分',workdays:'週3〜',about:'AI人材に特化したリクルーティング会社。技術を理解した上で最適なマッチングを実現。',skills:['コミュ力','傾聴力'],welcome:['採用 / 人事経験','AI 業界理解'],benefits:['インセンティブ','研修あり','週3〜']},
  ],
};

// ID生成ヘルパー: 'llm-0', 'prompt-3' など
// ID が部分的に壊れていても、同じカテゴリ内の他の求人を返してフォールバック
window.JOBS_GET = function(id) {
  if (!id) return null;
  var parts = id.split('-');
  if (parts.length < 2) return null;
  var cat = parts[0];
  var idx = parseInt(parts[1], 10);
  var list = window.JOBS_DATA[cat];
  // カテゴリ不明の場合は最初のカテゴリの最初の求人を返す
  if (!list || list.length === 0) {
    var firstCat = Object.keys(window.JOBS_DATA)[0];
    if (!firstCat) return null;
    cat = firstCat;
    list = window.JOBS_DATA[cat];
    idx = 0;
  }
  if (isNaN(idx) || idx < 0) idx = 0;
  if (!list[idx]) idx = Math.abs(idx) % list.length;
  var job = Object.assign({}, list[idx]);
  job.id = cat + '-' + idx;
  job.category = cat;
  return job;
};
