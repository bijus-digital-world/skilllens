import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { NodeHttp2Handler } from '@smithy/node-http-handler'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'

const MODEL_ID = 'amazon.nova-2-sonic-v1:0'

interface AudioConfig {
  inputSampleRate: number
  outputSampleRate: number
  voiceId: string
}

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  inputSampleRate: 16000,
  outputSampleRate: 24000,
  voiceId: 'matthew', // Polyglot voice — most natural sounding, supports Indian English
}

export interface NovaSonicSession {
  promptName: string
  audioContentName: string
  sendAudioChunk: (base64Audio: string) => void
  endAudioInput: () => void
  close: () => void
}

interface SessionCallbacks {
  onAudioOutput: (base64Audio: string) => void
  onTextOutput: (text: string, role: 'ASSISTANT' | 'USER') => void
  onError: (error: Error) => void
  onComplete: () => void
}

type StreamEvent = { chunk: { bytes: Uint8Array } }

function createEvent(event: Record<string, unknown>): StreamEvent {
  return {
    chunk: {
      bytes: new TextEncoder().encode(JSON.stringify({ event })),
    },
  }
}

export async function createNovaSonicSession(
  systemPrompt: string,
  callbacks: SessionCallbacks,
  audioConfig: AudioConfig = DEFAULT_AUDIO_CONFIG
): Promise<NovaSonicSession> {
  const handler = new NodeHttp2Handler({
    requestTimeout: 300000,
    sessionTimeout: 300000,
    disableConcurrentStreams: false,
    maxConcurrentStreams: 20,
  })

  const client = new BedrockRuntimeClient({
    region: config.aws.region,
    requestHandler: handler,
  })

  const promptName = uuidv4()
  const systemContentName = uuidv4()
  const audioContentName = uuidv4()

  // Dynamic event queue for audio chunks pushed after initial setup
  const dynamicQueue: StreamEvent[] = []
  let dynamicResolve: (() => void) | null = null
  let streamDone = false
  let closed = false

  function pushEvent(event: StreamEvent) {
    dynamicQueue.push(event)
    if (dynamicResolve) {
      const r = dynamicResolve
      dynamicResolve = null
      r()
    }
  }

  function completeStream() {
    streamDone = true
    if (dynamicResolve) {
      const r = dynamicResolve
      dynamicResolve = null
      r()
    }
  }

  // Build the initial events that must be sent first
  const initialEvents: StreamEvent[] = [
    // 1. sessionStart — tuned for natural conversation
    createEvent({
      sessionStart: {
        inferenceConfiguration: {
          maxTokens: 256,       // Short responses — 1-2 sentences max
          topP: 0.9,            // Slightly focused for more coherent output
          temperature: 0.6,     // Lower = more controlled, less rambling
        },
        turnDetectionConfiguration: {
          endpointingSensitivity: 'MEDIUM',  // MEDIUM avoids cutting off candidates mid-thought
          silenceThresholdMs: 1000,          // Wait 1 second of silence before assuming turn is over
        },
      },
    }),
    // 2. promptStart
    createEvent({
      promptStart: {
        promptName,
        textOutputConfiguration: {
          mediaType: 'text/plain',
        },
        audioOutputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: audioConfig.outputSampleRate,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId: audioConfig.voiceId,
          encoding: 'base64',
          audioType: 'SPEECH',
        },
      },
    }),
    // 3. System prompt - contentStart
    createEvent({
      contentStart: {
        promptName,
        contentName: systemContentName,
        type: 'TEXT',
        interactive: true,
        role: 'SYSTEM',
        textInputConfiguration: {
          mediaType: 'text/plain',
        },
      },
    }),
    // 3b. System prompt - textInput
    createEvent({
      textInput: {
        promptName,
        contentName: systemContentName,
        content: systemPrompt,
      },
    }),
    // 3c. System prompt - contentEnd
    createEvent({
      contentEnd: {
        promptName,
        contentName: systemContentName,
      },
    }),
    // 4. Audio input - contentStart
    createEvent({
      contentStart: {
        promptName,
        contentName: audioContentName,
        type: 'AUDIO',
        interactive: true,
        role: 'USER',
        audioInputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: audioConfig.inputSampleRate,
          sampleSizeBits: 16,
          channelCount: 1,
          audioType: 'SPEECH',
          encoding: 'base64',
        },
      },
    }),
  ]

  async function* generateEvents() {
    for (const event of initialEvents) {
      yield event
    }

    // Then yield dynamic events (audio chunks, end signals) as they arrive
    while (!streamDone) {
      if (dynamicQueue.length > 0) {
        yield dynamicQueue.shift()!
      } else {
        await new Promise<void>((r) => {
          dynamicResolve = r
        })
      }
    }

    // Drain remaining events
    while (dynamicQueue.length > 0) {
      yield dynamicQueue.shift()!
    }
  }

  // Send the command
  const command = new InvokeModelWithBidirectionalStreamCommand({
    modelId: MODEL_ID,
    body: generateEvents(),
  })

  // Process response in background
  client
    .send(command)
    .then(async (response) => {
      if (!response.body) {
        callbacks.onError(new Error('No response body'))
        return
      }

      let eventCount = 0
      // Track speculative content blocks to skip duplicate text
      const speculativeContents = new Set<string>()
      // Track the current content block being received
      let currentContentId: string | null = null
      let currentContentSpeculative = false

      for await (const event of response.body) {
        if (closed) break
        eventCount++

        if (event.chunk?.bytes) {
          try {
            const raw = new TextDecoder().decode(event.chunk.bytes)
            const parsed = JSON.parse(raw)
            const evt = parsed.event

            // contentStart tells us if the upcoming content is speculative or final
            if (evt?.contentStart) {
              currentContentId = evt.contentStart.contentName || null
              currentContentSpeculative = false

              const fields = evt.contentStart.additionalModelFields
              if (fields) {
                try {
                  const meta = typeof fields === 'string' ? JSON.parse(fields) : fields
                  if (meta.generationStage === 'SPECULATIVE') {
                    currentContentSpeculative = true
                    if (currentContentId) speculativeContents.add(currentContentId)
                  }
                } catch {
                  // ignore
                }
              }
            }

            if (evt?.audioOutput?.content) {
              callbacks.onAudioOutput(evt.audioOutput.content)
            }

            if (evt?.textOutput?.content) {
              const text = evt.textOutput.content

              // Skip interrupted signals
              if (text.includes('"interrupted"')) continue

              // Skip speculative text — only send final (audio-aligned) text
              const contentName = evt.textOutput.contentName || currentContentId
              if (contentName && speculativeContents.has(contentName)) continue
              if (currentContentSpeculative) continue

              const role = evt.textOutput.role === 'USER' ? 'USER' : 'ASSISTANT'
              callbacks.onTextOutput(text, role as 'ASSISTANT' | 'USER')
            }

            if (evt?.contentEnd) {
              currentContentId = null
              currentContentSpeculative = false
            }
          } catch {
            // skip malformed events
          }
        }
      }

      console.log(`[NovaSonic] Stream ended (${eventCount} events)`)
      callbacks.onComplete()
    })
    .catch((err: Error) => {
      console.error('[NovaSonic] Error:', err.message)
      if (!closed) {
        callbacks.onError(err)
      }
    })

  // Send silence frames every 30s to prevent Nova Sonic 55s timeout
  // 16kHz mono 16-bit = 32000 bytes/sec. 100ms of silence = 3200 bytes = 1600 samples of 0
  const silenceFrame = Buffer.alloc(3200, 0).toString('base64')
  const keepaliveInterval = setInterval(() => {
    if (closed || streamDone) return
    pushEvent(
      createEvent({
        audioInput: {
          promptName,
          contentName: audioContentName,
          content: silenceFrame,
        },
      })
    )
  }, 30000)

  return {
    promptName,
    audioContentName,

    sendAudioChunk(base64Audio: string) {
      if (closed || streamDone) return
      pushEvent(
        createEvent({
          audioInput: {
            promptName,
            contentName: audioContentName,
            content: base64Audio,
          },
        })
      )
    },

    endAudioInput() {
      clearInterval(keepaliveInterval)
      if (closed || streamDone) return
      pushEvent(
        createEvent({
          contentEnd: {
            promptName,
            contentName: audioContentName,
          },
        })
      )
      pushEvent(
        createEvent({
          promptEnd: {
            promptName,
          },
        })
      )
      pushEvent(
        createEvent({
          sessionEnd: {},
        })
      )
      completeStream()
    },

    close() {
      clearInterval(keepaliveInterval)
      closed = true
      completeStream()
      handler.destroy()
    },
  }
}
