require('dotenv').config()

const fetch = require('node-fetch')
const log = require('fancy-log')
const { graphql } = require('@octokit/graphql')
const config = require('./config.json')

const {
  LASTFM_API_KEY,
  GITHUB_TOKEN
} = process.env

const graphqlAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`
  }
})

const messageFmt = track => `Listening to ${track.name} by ${track.artist}`

const LASTFM_API_URL = [
  'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks',
  'format=json',
  'limit=1',
  'user=' + config.LASTFM_USERNAME,
  'api_key=' + LASTFM_API_KEY
].join('&')

async function getNowPlaying () {
  const res = await fetch(LASTFM_API_URL)
  const json = await res.json()

  const [track] = json.recenttracks.track
  if (!(track['@attr'] && track['@attr'].nowplaying)) return

  const { name, artist: { '#text': artist } } = track
  return { name, artist }
}

async function updateGithubStatus (message, emoji) {
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
}

async function main () {
  let processing = false
  let currentlyPlayingMessage

  setInterval(async () => {
    if (processing) return
    processing = true

    const nowPlaying = await getNowPlaying()

    if (!nowPlaying) {
      log('Nothing playing')

      if (currentlyPlayingMessage) {
        log('Updating to default')
        await updateGithubStatus(config.DEFAULT_MESSAGE, config.DEFAULT_EMOJI)
      }

      currentlyPlayingMessage = undefined
      return
    }

    const nowPlayingMessage = messageFmt(nowPlaying)
    if (currentlyPlayingMessage === nowPlayingMessage) {
      log(`Still playing last track, not updating`)
      return
    }

    currentlyPlayingMessage = nowPlayingMessage
    await updateGithubStatus(nowPlayingMessage, config.NOW_PLAYING_EMOJI)

    processing = false
  }, config.REFRESH_INTERVAL)
}

main()
