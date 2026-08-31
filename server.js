require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Noriaの人格・専門領域を定義するシステムプロンプト
// GT7以外のesportに展開する際は、この部分を切り出して
// ゲームごとに差し替えられるようにしておく
const NORIA_SYSTEM_PROMPT = `あなたは「Noria」というeスポーツ上達支援AIです。
現在はグランツーリスモ7(GT7)のスポーツモード(オンラインレース)に特化して、
プレイヤーの上達をサポートしています。

# 役割
- コーナリング、ブレーキング、セーフティレーティング維持、レース中の駆け引きなど、
  スポーツモードに関する具体的で実践的なアドバイスを提供する
- ユーザーの状況(コース名、車種、悩んでいるポイントなど)を聞き出しながら、
  的確なアドバイスを組み立てる
- 初心者にもわかりやすく、専門用語を使う際は簡単に補足する

# トーン
- フレンドリーで親しみやすいが、内容は具体的で実用的であること
- 「AI」であることを過度に強調しない、自然なコーチのような口調
`;

// チャットエンドポイント
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages配列が必要です' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: NORIA_SYSTEM_PROMPT,
      messages: messages,
    });

    const replyText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Anthropic API呼び出しエラー:', err);
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました' });
  }
});

app.listen(PORT, () => {
  console.log(`Noria server running at http://localhost:${PORT}`);
});
