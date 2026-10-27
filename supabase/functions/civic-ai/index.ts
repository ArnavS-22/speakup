const TOPIC_TAGS = [
  'youth_programs',
  'youth_spaces',
  'youth_events',
  'teen_services',
  'pedestrian_safety',
  'bike_infrastructure',
  'trails',
  'traffic',
  'parks',
  'recreation_facilities',
  'school_site',
  'school_policy',
  'school_district',
  'city_budget',
  'housing',
  'public_safety',
  'environment',
  'library',
  'arts',
  'federal_issue',
  'private_matter',
  'other',
] as const;

type Action = 'understand' | 'draft' | 'shorten' | 'summarize_item';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Isolated provider call. Swap this function to change vendors. */
async function callLlm(system: string, user: string): Promise<string> {
  const key = Deno.env.get('LLM_API_KEY');
  if (!key) throw new Error('LLM_API_KEY is not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`llm ${res.status}`);
  }
  const payload = await res.json();
  const text = payload?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? '';
  return text.trim();
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('no json');
  return JSON.parse(text.slice(start, end + 1));
}

async function requestJson(system: string, user: string): Promise<unknown> {
  const first = await callLlm(system, user);
  try {
    return extractJson(first);
  } catch {
    const retry = await callLlm(
      `${system}\nReturn ONLY valid JSON. No markdown.`,
      user,
    );
    return extractJson(retry);
  }
}

function understandSystem() {
  return `You extract civic comment fields for a California local-government helper.
Return strict JSON:
{"intent":"problem|idea|agenda|question|thanks","topics":[...],"scope":"single_school|district|city|federal|private|unclear","location":string|null,"ask":string|null,"impact":string|null,"summary":string,"detected_language":"en|es|zh|hi|pa|ko|te|vi|tl","unsafe":boolean}
The user may write in any language. Set detected_language to the closest supported code; write "summary" in that language.
Topics must be chosen only from: ${TOPIC_TAGS.join(', ')}.
Never invent details the user did not say; use null instead.
Set unsafe true if the text contains threats, harassment, or personal attacks on specific private individuals.
Do not write a comment. JSON only.`;
}

function draftSystem() {
  return `You draft a spoken public comment for a local commission.
Return strict JSON: {"drafts":{"en":string,"<sourceLanguage>":string},"word_count":number}
Always include an English draft (the meeting language) and a draft in the speaker's sourceLanguage (one of en, es, zh, hi, pa, ko, te, vi, tl). If sourceLanguage is en, return only "en".
Rules:
- Follow the intent structure: problem→where→who it affects→ask; idea→why needed→who benefits→ask; agenda→item number+title→position→one reason→ask; question→context→question→request it be looked into; thanks→what worked→why it mattered→keep doing it.
- Open with the speaker introduction. Lead with the ask. Use the user's own words. No generic civic filler.
- Stay under timeLimitMinutes * 130 words; aim for about 85% of that.
- Respectful tone. For can_listen, do not ask the body to vote that night; ask them to consider a future agenda item.
- End with thanks.
JSON only.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const action = body.action as Action;
    if (action === 'understand') {
      const data = await requestJson(
        understandSystem(),
        JSON.stringify({ text: body.text, chosenIntent: body.chosenIntent, language: body.language }),
      );
      return json(data);
    }
    if (action === 'draft') {
      const data = await requestJson(draftSystem(), JSON.stringify(body));
      return json(data);
    }
    if (action === 'shorten') {
      const data = await requestJson(
        'Shorten a public comment. Keep the speaker intro, the ask, and thanks. Stay under timeLimitMinutes * 130 words. Return JSON {"draft":string} only.',
        JSON.stringify(body),
      );
      return json(data);
    }
    if (action === 'summarize_item') {
      const data = await requestJson(
        'Summarize an agenda title in two plain sentences in the requested language. Return JSON {"summary":string} only. Do not invent facts.',
        JSON.stringify(body),
      );
      return json(data);
    }
    return json({ error: 'unknown action' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error';
    return json({ error: message }, 500);
  }
});
