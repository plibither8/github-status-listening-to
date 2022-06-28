import { graphql } from "@octokit/graphql";
import got from "got";
import config from "./config.js";

interface NowPlaying {
  song: string;
  artist: string;
}

interface LastfmResponse {
  recenttracks: {
    track: {
      name: string;
      artist: { "#text": string };
      "@attr"?: { nowplaying?: boolean };
    }[];
  };
}

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${config.githubApiToken}`,
  },
});

const log = (message: string, type: "log" | "error" = "log") => {
  const time = new Date().toTimeString().substring(0, 8);
  console[type](`[${time}] ${message}`);
};

const getLastfmEndpoint = (): string => {
  const BASE_URL = "https://ws.audioscrobbler.com/2.0/";
  const queryParams: Record<string, any> = {
    method: "user.getrecenttracks",
    format: "json",
    limit: 1,
    user: config.lastfmUsername,
    api_key: config.lastfmApiToken,
  };
  const url = new URL(BASE_URL);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

const LASTFM_API_URL = getLastfmEndpoint();

async function getNowPlayingFromLastfm(): Promise<NowPlaying> {
  try {
    const data = await got(LASTFM_API_URL).json<LastfmResponse>();
    const [track] = data.recenttracks.track;

    // No track is playing right now
    if (!track["@attr"]?.nowplaying) return undefined;

    // Return track info
    return {
      song: track.name,
      artist: track.artist["#text"],
    };
  } catch (err) {
    log(String(err), "error");
    return;
  }
}

async function updateGithubStatus(message: string, emoji: string) {
  const MUTATE_STATUS = `
    mutation($message: String, $emoji: String) {
      changeUserStatus(input: {
        emoji: $emoji
        message: $message
      }) {
        status {
          message
        }
      }
    }
  `;
  try {
    await graphqlWithAuth(MUTATE_STATUS, {
      message,
      emoji,
    });
    log(`Status updated to: ${emoji} ${message}`);
  } catch (err) {
    log(String(err), "error");
  }
}

async function checkAndUpdate(
  currentlyPlayingMessage?: string
): Promise<string> {
  const nowPlaying = await getNowPlayingFromLastfm();

  // If no song is playing and the current status is playing, reset to default
  if (!nowPlaying && currentlyPlayingMessage) {
    log("Updating to default");
    await updateGithubStatus(config.defaultMessage, config.defaultEmoji);
    return undefined;
  }

  // If no song is playing, no need to update
  if (!nowPlaying) {
    return undefined;
  }

  const nowPlayingMessage = `Listening to ${nowPlaying.song} by ${nowPlaying.artist}`;

  // Don't update if same song is playing
  if (currentlyPlayingMessage === nowPlayingMessage) {
    return nowPlayingMessage;
  }

  // Finally, update if song change
  await updateGithubStatus(nowPlayingMessage, config.defaultEmoji);
  return nowPlayingMessage;
}

async function main() {
  let processing: boolean = false;
  let currentlyPlayingMessage: string = undefined;

  const loop = async () => {
    if (processing) return;
    processing = true;
    currentlyPlayingMessage = await checkAndUpdate(currentlyPlayingMessage);
    processing = false;
  };

  loop();
  setInterval(loop, config.refreshInterval);
}

main();
