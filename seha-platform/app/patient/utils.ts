export const callGemini = async (prompt: string, sysInst: string): Promise<string> => {
  const key = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (!key) return 'مفتاح الذكاء الاصطناعي غير مضبوط. اتصل بمزودك.';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: sysInst }] },
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'لم أتمكن من توليد استجابة.';
};

export const processAI = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-violet-700">$1</strong>').replace(/\n/g, '<br/>');
