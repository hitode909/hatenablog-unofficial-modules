/*

* はてなブログの各記事に「この記事のアンソロジーはいかがですか」コーナーを追加する

** 使い方

- 以下をコピーして デザイン編集 → カスタマイズ → フッタHTML に貼り付け

<script async defer src="https://hitode909.github.io/hatenablog-unofficial-modules/anthology.js"></script>

** 動作

- Chrome 内蔵の Prompt API (LanguageModel) で、記事からいろいろな芸風の短文（アンソロジー）を生成する
- 記事ページでもブログトップでも動き、ページ内の各記事に1つずつウィジェットが付く
- 処理は端末内で完結し、外部に通信しない。初回利用時に Gemini Nano (数GB) のダウンロードが走る

** 注意

- Prompt API が有効な Chrome (デスクトップ) 専用。非対応ブラウザでは何も表示しない
- 推奨環境 (Chrome の公式ガイドより): 空きストレージ 22GB・RAM 16GB・4コア以上の CPU

*/

(() => {
  const MAX_INPUT_CHARS = 4000;
  // すべての芸風に共通で付ける指示
  const PLAIN_TEXT_RULE = '出力はプレーンテキストにしてください。マークダウン記法（**、#、-など）や装飾記号は使わないでください。';

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // 「もう一度執筆する」の芸風。押すたびにランダムに選ばれる（前回と同じ芸風は選ばない）
  const GEIFU = [
    () => {
      const style = pick([
        'SF小説として',
        '卒業論文の一節として',
        '恋愛小説として',
        '無茶な例え話を使って',
        'ハードボイルド小説として',
        '昔話の語り口で',
        '演劇の脚本として',
        '叙事詩として',
      ]);
      return `この記事に続く新しい文章だけを、${style}100文字程度で書いてください。本文の繰り返しや要約は含めず、続きの文章だけを出力してください。`;
    },
    () => 'この記事の内容を、それらしいが実在しない嘘の漢詩に翻訳してください。漢詩だけを100文字程度で出力してください。',
    () => {
      const field = pick(['哲学', '情報科学', '文学', '経済学', '社会学', '生物学', '経営学']);
      return `この記事の内容の${field}的バックグラウンドを解説してください。多少無理な当てはめでも強引に${field}の概念で解釈して、100文字程度で出力してください。`;
    },
    () => 'この記事の文中の内容をモチーフにした、カギ括弧つきのひとことセリフを1つ生成してください。カギ括弧つきのセリフだけを100文字程度で出力してください。',
    () => {
      const style = pick(['異世界転生もの', 'ライトノベル', '自己啓発書', '週刊誌の見出し', '学術論文']);
      return `この記事に、${style}のスタイルに沿った長文のタイトルをつけてください。タイトルだけを100文字程度で出力してください。`;
    },
    () => 'この記事の主要な登場概念を、矢印や記号を使ったアスキーアートのチャートに変換してください。チャートだけを100文字程度で出力してください。',
    () => 'この記事が新書だとして、その帯に載るスタイルの紹介文を100文字程度で書いてください。帯の文だけを出力してください。',
    () => 'この記事の序文に置ける、記事の内容に合った名言とその出典を1つ考えてください。「名言」（人名『出典』より）の形式で、見出しやマークダウン記法は使わず、名言と出典だけを100文字程度で出力してください。',
    () => 'この記事を学園もののアンソロジーにした場合の一場面として、登場人物2人のセリフが2〜3往復する会話劇を、全体で140文字程度に圧縮して書いてください。教室・部活・放課後など、セリフの端々から学園ものというジャンルが滲み出るようにしてください。カギ括弧つきのセリフの応酬だけを出力してください。',
    () => 'この記事をアニメ化した場合のキャラクターソングとして、この記事のテーマソングを作詞してください。「曲名」に続けて1番の歌詞を、全体で140文字程度で書いてください。曲名と歌詞だけを出力してください。',
  ];

  const main = () => {
    if (!('LanguageModel' in window)) return;
    const entries = [...document.querySelectorAll('article.entry')];
    if (entries.length === 0) return;

    const style = document.createElement('style');
    style.textContent =
      '.ai-anthology-action { color: #555; text-decoration: none; cursor: pointer; padding: 0.2em 0.5em; border-radius: 4px; margin-left: 0.8em; }' +
      '.ai-anthology-action:hover { background: rgba(128,128,128,0.25); text-decoration: none; }';
    document.head.appendChild(style);

    // モデルのセッションはページで1つだけ作り、生成のたびに clone して使う
    // （記事をまたいで会話の文脈が混ざらないようにするため）
    let basePromise = null;
    const ensureBase = (onProgress) => {
      if (!basePromise) {
        basePromise = LanguageModel.create({
          expectedInputs: [{ type: 'text', languages: ['ja'] }],
          expectedOutputs: [{ type: 'text', languages: ['ja'] }],
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => onProgress(e.loaded));
          },
        });
      }
      return basePromise;
    };

    const setup = (entry) => {
      const article = entry.querySelector('.entry-content');
      const anchor = entry.querySelector('.entry-footer .social-buttons');
      if (!article || !anchor) return;
      const permalink = entry.querySelector('.entry-title a')?.href || location.href;

      const box = document.createElement('div');
      box.style.cssText = 'margin:1em 0;padding:1em;border:1px solid #ddd;border-radius:8px;';
      box.innerHTML = '<div style="font-weight:bold;margin-bottom:0.5em;">🤖この記事のアンソロジーはいかがですか</div>' +
        '<div style="font-size:0.8em;color:#888;margin-bottom:0.5em;">お使いのブラウザに内蔵されたオンデバイスAIが記事のアンソロジーを書きます。処理は端末内で完結し、外部に通信しません。初回はAIモデル（数GB）のダウンロードが走ります。完成したアンソロジーはXに投稿できます。</div>';

      const writeButton = document.createElement('button');
      writeButton.textContent = '執筆する';
      writeButton.style.cssText = 'padding:0.4em 0.8em;border:1px solid #ccc;border-radius:4px;background:#fff;color:#333;cursor:pointer;display:block;width:100%;text-align:center;box-sizing:border-box;';

      // 作品カード: 生成テキスト＋右下のアクションリンク
      const card = document.createElement('div');
      card.style.cssText = 'padding:0.8em;background:rgba(128,128,128,0.1);border-radius:4px;display:none;';
      const output = document.createElement('pre');
      output.style.cssText = 'white-space:pre-wrap;margin:0;font-family:inherit;';
      const actions = document.createElement('div');
      actions.style.cssText = 'text-align:right;margin-top:0.5em;font-size:0.85em;visibility:hidden;';
      const retryLink = document.createElement('a');
      retryLink.className = 'ai-anthology-action';
      retryLink.textContent = 'もう一度執筆する';
      const tweetLink = document.createElement('a');
      tweetLink.className = 'ai-anthology-action';
      tweetLink.textContent = 'Xにポストする';
      tweetLink.target = '_blank';
      tweetLink.rel = 'noopener';
      actions.appendChild(retryLink);
      actions.appendChild(tweetLink);
      card.appendChild(output);
      card.appendChild(actions);

      let running = false;
      let lastGeifu = null;

      const buildPrompt = () => {
        const geifu = pick(GEIFU.filter((g) => g !== lastGeifu));
        lastGeifu = geifu;
        return geifu();
      };

      const run = async () => {
        if (running) return;
        running = true;
        writeButton.style.display = 'none';
        card.style.display = 'block';
        actions.style.visibility = 'hidden';
        let session = null;
        try {
          const availability = await LanguageModel.availability();
          if (availability === 'unavailable') {
            output.textContent = 'このブラウザ・端末ではオンデバイスAIが利用できません。デスクトップ版Chromeの最新版でお試しください。';
            return;
          }
          output.textContent = availability === 'available' ? '準備中…' : 'AIモデルをダウンロード中…（初回のみ）';
          const base = await ensureBase((loaded) => {
            output.textContent = `AIモデルをダウンロード中… ${Math.round(loaded * 100)}%`;
          });
          session = await base.clone();
          output.textContent = '考え中…';
          const text = article.innerText.slice(0, MAX_INPUT_CHARS);
          const prompt = buildPrompt();
          const stream = session.promptStreaming(`以下は記事の本文です。\n---\n${text}\n---\n${prompt}${PLAIN_TEXT_RULE}`);
          output.textContent = '';
          for await (const chunk of stream) {
            output.textContent += chunk;
          }
          // 指示しても混ざることがあるマークダウン装飾を除去する
          const result = output.textContent.trim().replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
          output.textContent = result;
          tweetLink.href = 'https://x.com/intent/post?' + new URLSearchParams({
            text: result,
            url: permalink,
          });
          tweetLink.style.display = '';
          actions.style.visibility = 'visible';
        } catch (e) {
          output.textContent = `エラー: ${e.message}`;
          tweetLink.style.display = 'none';
          actions.style.visibility = 'visible';
        } finally {
          session?.destroy();
          running = false;
        }
      };

      writeButton.addEventListener('click', run);
      retryLink.addEventListener('click', run);

      box.appendChild(writeButton);
      box.appendChild(card);
      // ソーシャルボタンの下（コメント欄の上）に挿す
      anchor.insertAdjacentElement('afterend', box);
    };

    entries.forEach(setup);
  };

  // async で読み込まれると DOM 構築前に実行されることがあるため待つ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
