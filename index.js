require('dotenv').config()

const fetch = require('node-fetch')
const log = require('fancy-log')
const { graphql } = require('@octokit/graphql')
const config = require('./config.json')

const graphqlAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`
  }
})

const LASTFM_API_URL = [
  'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks',
  'format=json',
  'limit=1',
  'user=' + config.LASTFM_USERNAME,
  'api_key=' + process.env.LASTFM_API_KEY
].join('&')

async function getNowPlaying () {
  try {
    const res = await fetch(LASTFM_API_URL)
    const json = await res.json()

    const [track] = json.recenttracks.track
    if (!(track['@attr'] && track['@attr'].nowplaying)) return

    const { name, artist: { '#text': artist } } = track
    return { name, artist }
  } catch (err) {
    return
  }
}

async function updateGithubStatus (message, emoji) {
  try {
    const data = await graphqlAuth(
      `
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
      `, {
        message,
        emoji
      }
    )
    log(`Status updated to: ${emoji}: ${message}`)
  } catch (err) {
    console.error('An error occured :/')
  }
}

async function checkAndUpdate (currentlyPlayingMessage) {
  const nowPlaying = await getNowPlaying()

  if (!nowPlaying && currentlyPlayingMessage) {
    log('Updating to default')
    await updateGithubStatus(config.DEFAULT_MESSAGE, config.DEFAULT_EMOJI)
    return
  }

  if (!nowPlaying) return

  const nowPlayingMessage = `Listening to ${nowPlaying.name} by ${nowPlaying.artist}`
  if (currentlyPlayingMessage === nowPlayingMessage) return nowPlayingMessage

  await updateGithubStatus(nowPlayingMessage, config.NOW_PLAYING_EMOJI)
  return nowPlayingMessage
}

async function main () {
  let processing = false
  let currentlyPlayingMessage

  setInterval(async () => {
    if (processing) return
    processing = true
    currentlyPlayingMessage = await checkAndUpdate(currentlyPlayingMessage)
    processing = false
  }, config.REFRESH_INTERVAL)
}

main()
