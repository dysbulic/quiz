import React, { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { z } from 'zod'
import { Tooltip } from 'react-tooltip'
import { sequence, shuffle } from './utils'
import form from './data/Form M.json5'
import './App.css'

type Maybe<T> = T | null
type Choice = Maybe<0 | 1>

type Question = {
  question: string
  options: Array<string>
}
type Questions = {
  part: string
  questions: Array<Question>
}
const QuestionsSchema = z.object({
  part: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(2),
  }))
})

type Pair = Array<string>
type Pairs = {
  part: string
  pairs: Array<Pair>
}
const PairsSchema = z.object({
  part: z.string(),
  pairs: z.array(z.array(z.string()).length(2)),
})

const ConfigSchema = (
  z.array(z.union([
    QuestionsSchema,
    PairsSchema,
  ]))
)

type URLParams = {
  index?: string
  state?: string
  seed?: string
}

const state2progress = (state?: Maybe<string>) => {
  if(state == null) return []

  try {
    let bits: Maybe<Array<string>> = Array.from(
      atob(state)
      .split('')
      .map((char) => char.charCodeAt(0))
      .map((byte) => (
        byte.toString(2).padStart(8, '0')
      ))
      .join('')
      .match(/../g)
      ?? []
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    while(bits.length > 0 && bits.at(-1) === '00') {
      bits.pop()
    }
    if(bits.length === 0) {
      bits = []
    }

    return bits.map((field) => {
      switch(field) {
        case '01': return 0
        case '10': return 1
        default: return null
      }
    })
  } catch(err) {
    console.error((err as Error).message)
  }

  return []
}

const progress2state = (
  (progress?: Maybe<Array<Maybe<number>>>) => {
    if(progress == null) return null

    try {
      const bits = progress.map((field) => {
        switch(field) {
          case 0: return '01'
          case 1: return '10'
          default: return '00'
        }
      })
      const state = (
        bits
        .join('')
        .match(/.{1,8}/g)
        ?.map((byte) => (
          String.fromCharCode(parseInt(byte, 2))
        ))
        .join('')
      ) as string
      const out = btoa(state)

      return out || null
    } catch(err) {
      console.error((err as Error).message)
    }

    return null
  }
)

export function App() {
  const params = (
    new URLSearchParams(window.location.search)
  )
  const qIndexString = params.get('index')
  const qIndex = (
    qIndexString ? Number(qIndexString) - 1 : null
  )
  const sections = ConfigSchema.parse(form)
  const groups = sections.map((sec) => (
    (sec as Questions).questions
    ?? (sec as Pairs).pairs
  ))
  const choices = groups.flat()
  let seq = sequence(choices.length)
  const seed = params.get('seed') ?? undefined
  if(seed) seq = shuffle<number>(seq, { seed })
  const state = params.get('state')
  const [progress, setProgress] = (
    useState(state2progress(state))
  )

  const choose = (
    { at, choice }:
    { at: number, choice: Choice }
  ) => {
    console.log({ in: { at, choice } })
    setProgress((prev) => {
      return [
        ...prev.slice(0, at),
        choice,
        ...prev.slice(at + 1),
      ]
    })
  }

  const getChoice = (
    { idx, choice }:
    { idx: number, choice?: Maybe<number> }
  ) => {
    if(idx >= choices.length) {
      throw new Error('Out of bounds.')
    }

    const entry = choices[idx]
    const question = (
      <section>
        {(() => {
          if(entry.question) {
            if(choice == null) {
              return `${entry.question} ${entry.options.join(' or ')}?`
            } else {
              return (
                <p>
                  {entry.question}
                  {' '}
                  <span className="chosen">
                    {entry.options[choice]}
                  </span>
                  {' or '}
                  <span className="unchosen">
                    {entry.options[(choice + 1) % 2]}
                  </span>
                  {'?'}
                </p>
              )
            }
          } else if(Array.isArray(entry)) {
            if(choice == null) {
              return `${entry.join(' or ')}?`
            } else {
              return (
                <>
                  <span className="chosen">
                    {entry[choice]}
                  </span>
                  {' or '}
                  <span className="unchosen">
                    {entry[(choice + 1) % 2]}
                  </span>
                  {'?'}
                </>
              )
            }
          } else {
            return (
              `Unknown type of entry: "${
                JSON.stringify(entry, null, 2)
              }".`
            )
          }
        })()}
      </section>
    )
    return { question, entry }
  }
  const currentIndex = Math.min(
    choices.length - 1, qIndex ?? progress?.length ?? 0
  )

  return (
    <main>
      <h1>MBTI Inventory</h1>

      <ol id="progress">
        {choices.map(
          (_entry: Pair | Question, idx: number) => {
            if(idx >= seq.length) return null

            const selection = seq[idx]
            const choice = progress?.[idx]
            const known = choice != null

            const { question: q } = getChoice(
              { idx: selection, choice }
            )

            const linkParams: URLParams = {
              index: String(idx + 1),
            }
            Object.entries(
              { state: progress2state(progress), seed }
            ).map(([key, value]) => {
              if(value) {
                linkParams[key as keyof URLParams] = (
                  value
                )
              }
            })
            const query = new URLSearchParams(linkParams)

            const classes = (
              [`${!known ? 'un' : ''}known`]
            )
            if(idx === currentIndex) {
              classes.push('active')
            }

            return (
              <li
                key={idx}
                className={classes.join(' ')}
                data-tooltip-id="tooltip"
                data-tooltip-html={
                  renderToStaticMarkup(q)
                }
              >
                <a href={`?${query.toString()}`}>
                  {idx + 1}
                </a>
              </li>
            )
          }
        )}
      </ol>

      <section id="prompt">
        {(() => {
          const selection = seq[currentIndex]
          const { entry } = getChoice(
            {
              idx: selection,
              choice: progress?.[selection],
            }
          )
          if(entry.question) {
            return (
              <form className="question">
                <p>{entry.question}</p>
                <ul className="options">
                  {entry.options.map(
                    (option: string, idx: number) => (
                      <React.Fragment key={idx}>
                        <li>
                          <label>
                            <input
                              type="radio"
                              name={`options-${selection}`}
                              onClick={() => {
                                console.log({ idx, currentIndex })
                                choose({
                                  at: currentIndex,
                                  choice: idx as Choice,
                                })
                              }}
                            />
                            {option}
                          </label>
                        </li>
                        {idx < entry.options.length - 1 && (
                          <li className="or">or</li>
                        )}
                      </React.Fragment>
                    )
                  )}
                </ul>
              </form>
            )
          } else if(Array.isArray(entry)) {
            return entry.join(' or ')
          } else {
            return 'Unknown type of entry.'
          }
        })()}
      </section>
      <Tooltip id="tooltip"/>
    </main>
  )
}

export default App
