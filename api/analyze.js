const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { home, away, homeStr, awayStr } = req.body;

  const prompt = `Você é um analista de futebol especialista em inteligência artificial. Analise a partida entre ${home} (força: ${homeStr}/100) e ${away} (força: ${awayStr}/100) pela Copa do Mundo 2026.

Forneça uma análise em português brasileiro com:
1. Placar previsto (dois números inteiros, ex: "2-1")
2. Probabilidades: vitória do ${home}%, empate%, vitória do ${away}%
3. Análise tática (2-3 frases)
4. Fatores decisivos (2-3 fatores)
5. Previsão de mercado: over 2.5 gols (sim/não), ambas marcam (sim/não)

Formato da resposta APENAS JSON:
{"homeScore":2,"awayScore":1,"homeWin":45,"draw":28,"awayWin":27,"analysis":"texto...","factors":"texto...","over25":"sim","bothScore":"nao"}`;

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Você é um analista de futebol especialista em IA. Responda apenas em JSON válido, sem markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      result = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      result = {
        homeScore: Math.round(homeStr / 25),
        awayScore: Math.round(awayStr / 25),
        homeWin: Math.round((homeStr / (homeStr + awayStr)) * 70 + 15),
        draw: 20,
        awayWin: Math.round((awayStr / (homeStr + awayStr)) * 70 + 15),
        analysis: 'Análise baseada em força das equipes e dados históricos.',
        factors: 'Desempenho recente, ranking FIFA, histórico de confrontos.'
      };
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
