# 🎧 github-status-listening-to

> Update my GitHub status to whatever song I'm listening

Updates my GitHub status to whatever song I'm listening right now, in the format "🎧 Listening to [name] by [artist]".

Really just set this up to get my hands dirty with GraphQL. And why not?

## Setup

1. Clone repo and install the dependencies (`npm install`, `pnpm install`, etc.)
2. Copy the [`.env.example`](/.env.example) into `.env` and update with your Last.fm and GitHub tokens.
3. Update your username and other configs (optional) [over here](/src/config.ts)
4. Build and start the script:
   ```sh
   $ npm run build
   $ npm start
   ```
5. For development, use `npm run dev`

## License

[MIT](LICENSE)
