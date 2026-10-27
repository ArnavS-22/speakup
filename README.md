# Speak Up

An iOS app that helps you stay informed on what your city is deciding and fast-tracks what you want to say to the right commission. Built for the 2026 Congressional App Challenge (CA-14).

Speak Up prepares and routes a public comment. You deliver it yourself at the meeting; the app never submits anything to a government body.

## How it works

1. **Say it.** Type a concern in your own words.
2. **Label it.** The `civic-ai` server function asks Claude to label the comment with one of five comment types and topics from a fixed list of 22 (`lib/types.ts`). `validUnderstand` in `lib/ai.ts` rejects anything off the list.
3. **Fill the gaps.** `nextMissingField` (`lib/questions.ts`) asks only for what's missing: location, what should change, who it affects, who's speaking.
4. **Route it.** `routeIssue` (`lib/routing.ts`) checks scope first (federal, private, single school), then matches topics to the commission that owns them, then `matchAgendaItem` scores upcoming agenda items by topic overlap.
5. **Draft and practice.** A spoken comment sized to the commission's time limit (`lib/timing.ts`), with a practice countdown.
6. **Show up.** The meeting card shows the real date, room and speaking rule, and adds the meeting to your calendar (`lib/calendar.ts`).

## Real meeting data

`lib/civicclerk.ts` reads Pleasanton's meetings and agendas from the city's CivicClerk API (`/v1/Events` and `/v1/Meetings/{id}`) each time the app opens. `tagItem` labels each agenda item with the same topic list used for comments. If the network is unavailable, the app uses the bundled copy in `data/civicclerk-snapshot.json`.

## Setup

```bash
npm install
npx expo start
```

Open in Expo Go on an iPhone.

To enable Claude, deploy the server function and set its key:

```bash
supabase functions deploy civic-ai
supabase secrets set LLM_API_KEY=your_key
```

Then set `EXPO_PUBLIC_FUNCTION_URL` to the deployed function URL. Without it, the app labels and drafts locally with keyword matching and templates (`lib/mockAi.ts`).

Comments are stored on the device with AsyncStorage.

## Tests

```bash
npm test
```

Covers routing, questions, timing, languages and the CivicClerk loader.

## Built with

Expo, React Native, TypeScript, expo-router, expo-calendar, AsyncStorage, i18next, Supabase Edge Functions, and the Anthropic Messages API.

## License

MIT
