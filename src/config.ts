import "dotenv/config.js";

type Emoji = `:${string}:`;

interface Config {
  /** Your Last.fm username */
  lastfmUsername: string;
  /** How many milliseconds until the next refresh */
  refreshInterval: number;

  /** The default user status when no song is playing */
  defaultMessage: string;
  /** The default user emoji when no song is playing */
  defaultEmoji: Emoji;
  /** The user emoji when a song is playing */
  nowPlayingEmoji: Emoji;

  /** 🤫 Your GitHub API token */
  githubApiToken: string;
  /** 🤫 Your Last.fm API token */
  lastfmApiToken: string;
}

const config: Config = {
  lastfmUsername: "plibither8",
  nowPlayingEmoji: ":headphones:",
  refreshInterval: 10000,
  defaultMessage: "Good times, good times",
  defaultEmoji: ":ok_hand:",
  githubApiToken: process.env.GITHUB_API_TOKEN,
  lastfmApiToken: process.env.LASTFM_API_TOKEN,
};

export default config;
