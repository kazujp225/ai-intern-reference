import sys
from subprocess import check_output

def main():
    path = "reference/original.html"
    with open(path, "r", encoding="utf-8") as f:
        current_content = f.read()

    # Get the old content from git
    old_content = check_output(["git", "show", "HEAD:" + path], text=True)

    # Extract .ai-quotes-section from old_content
    # By finding <!-- AI名言集 --> and everything up to but not including <footer class="page-footer">
    quotes_start = old_content.find("<!-- AI名言集 -->")
    footer_start = old_content.find('<footer class="page-footer">', quotes_start)
    if quotes_start == -1 or footer_start == -1:
        print("Could not find AI quotes in old git history.")
        sys.exit(1)
    
    ai_quotes_html = old_content[quotes_start:footer_start].strip()

    # Extract .fc-filter from current_content
    # By finding <!-- ====== フィルター (横並びチップグループ型) - ページ最下部 ====== --> and everything up to <footer class="page-footer">
    filter_start = current_content.find("<!-- ====== フィルター (横並びチップグループ型) - ページ最下部 ====== -->")
    cur_footer_start = current_content.find('<footer class="page-footer">', filter_start)
    if filter_start == -1 or cur_footer_start == -1:
        print("Could not find fc-filter in current content.")
        sys.exit(1)
    
    fc_filter_html = current_content[filter_start:cur_footer_start]

    # Remove fc_filter_html from current content
    new_content = current_content.replace(fc_filter_html, "")

    # We need to insert fc-filter_html back to its original place, which is immediately before <!-- ====== 体験者の声 ====== -->
    student_voice_anchor = "<!-- ====== 体験者の声 ====== -->"
    
    fc_filter_restored = """        <!-- ====== フィルター (横並びチップグループ型) ====== -->
        <div class="fc-filter">
          <div class="fc-section">
            <div class="fc-label">AI職種から探す</div>
            <div class="fc-chips">
              <a class="fc-chip fc-hot" href="#">LLMアプリ開発 <span class="fc-n">56</span></a>
              <a class="fc-chip" href="#">プロンプトエンジニア <span class="fc-n">42</span></a>
              <a class="fc-chip" href="#">MLエンジニア <span class="fc-n">38</span></a>
              <a class="fc-chip" href="#">データサイエンティスト <span class="fc-n">31</span></a>
              <a class="fc-chip" href="#">AI PMM / BizDev <span class="fc-n">27</span></a>
              <a class="fc-chip" href="#">AIリサーチャー <span class="fc-n">24</span></a>
              <a class="fc-chip" href="#">AIエージェント開発 <span class="fc-n">19</span></a>
              <a class="fc-chip" href="#">AI x クリエイティブ <span class="fc-n">15</span></a>
            </div>
          </div>
          <div class="fc-section">
            <div class="fc-label">尖った特徴から探す</div>
            <div class="fc-chips">
              <a class="fc-chip fc-hot" href="#">フルリモート可 <span class="fc-n">89</span></a>
              <a class="fc-chip fc-hot" href="#">未経験OK <span class="fc-n">67</span></a>
              <a class="fc-chip" href="#">時給2,000円以上 <span class="fc-n">52</span></a>
              <a class="fc-chip" href="#">文系歓迎 <span class="fc-n">45</span></a>
              <a class="fc-chip" href="#">CEO / CTO直下 <span class="fc-n">38</span></a>
              <a class="fc-chip" href="#">論文読み会あり <span class="fc-n">34</span></a>
              <a class="fc-chip" href="#">GPU使い放題 <span class="fc-n">23</span></a>
              <a class="fc-chip" href="#">Kaggle推奨 <span class="fc-n">21</span></a>
              <a class="fc-chip" href="#">論文共著チャンス <span class="fc-n">15</span></a>
              <a class="fc-chip" href="#">自社LLM開発中 <span class="fc-n">12</span></a>
              <a class="fc-chip" href="#">国際学会発表 <span class="fc-n">11</span></a>
              <a class="fc-chip" href="#">ストックオプションあり <span class="fc-n">8</span></a>
            </div>
          </div>
          <div class="fc-section">
            <div class="fc-label">AI領域から探す</div>
            <div class="fc-chips">
              <a class="fc-chip fc-hot" href="#">LLM / 大規模言語モデル <span class="fc-n">78</span></a>
              <a class="fc-chip" href="#">AI SaaS <span class="fc-n">56</span></a>
              <a class="fc-chip" href="#">AIエージェント <span class="fc-n">34</span></a>
              <a class="fc-chip" href="#">画像生成 / Diffusion <span class="fc-n">23</span></a>
              <a class="fc-chip" href="#">AI x 教育 <span class="fc-n">21</span></a>
              <a class="fc-chip" href="#">ヘルスケアAI <span class="fc-n">18</span></a>
              <a class="fc-chip" href="#">AI x 金融 <span class="fc-n">14</span></a>
              <a class="fc-chip" href="#">音声AI / TTS <span class="fc-n">12</span></a>
              <a class="fc-chip" href="#">ロボティクス / 具身化AI <span class="fc-n">9</span></a>
              <a class="fc-chip" href="#">AI x ゲーム <span class="fc-n">8</span></a>
            </div>
          </div>
          <div class="fc-section">
            <div class="fc-label">人気のAIキーワード</div>
            <div class="fc-chips">
              <a class="fc-chip" href="#">RAG</a>
              <a class="fc-chip" href="#">ファインチューニング</a>
              <a class="fc-chip" href="#">Claude</a>
              <a class="fc-chip" href="#">LangChain</a>
              <a class="fc-chip" href="#">Stable Diffusion</a>
              <a class="fc-chip" href="#">Kaggle</a>
              <a class="fc-chip" href="#">Transformer</a>
              <a class="fc-chip" href="#">強化学習</a>
            </div>
          </div>
        </div>\n\n"""
    
    new_content = new_content.replace(student_voice_anchor, fc_filter_restored + student_voice_anchor)

    # Insert the AI quotes section right before <footer class="page-footer">
    new_content = new_content.replace('<footer class="page-footer">', ai_quotes_html + '\n\n  <footer class="page-footer">')

    # Save format
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print("Successfully restored filter to original position and quotes section.")

if __name__ == "__main__":
    main()
