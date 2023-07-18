import React, { useCallback, useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { z } from 'zod'
import { Tooltip } from 'react-tooltip'
import { progress2state, sequence, shuffle, state2progress } from './utils'
import { Prompt } from './Prompt'
import form from './data/Form M.json5'
import './App.css'
import { Score } from './Score'

export type Maybe<T> = T | null
export type Choice = Maybe<0 | 1>

export type Question = {
  axis: string
  question: string
  options: Array<string>
}
export type Questions = {
  part: string
  questions: Array<Question>
}
export const QuestionsSchema = z.object({
  part: z.string(),
  questions: z.array(z.object({
    axis: z.string(),
    question: z.string(),
    options: z.array(z.string()).length(2),
  }))
})

export type Pair = {
  axis: string
  options: Array<string>
}
export type Pairs = {
  part: string
  pairs: Array<Pair>
}
export const PairsSchema = z.object({
  part: z.string(),
  pairs: z.array(z.object({
    axis: z.string(),
    options: z.array(z.string()).length(2)
  })),
})

export const ConfigSchema = (
  z.array(z.union([
    QuestionsSchema,
    PairsSchema,
  ]))
)

export type URLParams = {
  index?: string
  state?: string
  seed?: string
}

export type LinkParams = {
  progress?: Maybe<Array<Maybe<number>>>
} | undefined

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
  const origOrder = groups.flat()
  let seq = sequence(origOrder.length)
  const seed = params.get('seed') ?? undefined
  if(seed) seq = shuffle<number>(seq, { seed })
  const choices = seq.map((idx) => origOrder[idx])
  const state = params.get('state')
  const [progress, setProgress] = (
    useState(state2progress(state))
  )

  const choose = useCallback((
    { at, choice }:
    { at: number, choice: Choice }
  ) => {
    let out = progress ?? []
    if(out.length < at) {
      out = [
        ...out,
        ...Array.from(
          { length: at - out.length },
          () => null,
        )
      ]
    }
    out = [
      ...out.slice(0, at),
      choice,
      ...out.slice(at + 1),
    ]
    setProgress(out)
    return out
  }, [progress])

  const format = (
    { choice, chose }:
    { choice: Question | Pair, chose?: Choice }
  ) => {
    const question = (
      <section>
        {(() => {
          let out = ''
          if((choice as Question).question) {
            out = `${(choice as Question).question} `
          }
          if(chose == null) {
            return out += `${choice.options.join(' or ')}?`
          } else {
            return (
              <p>
                {out}
                <span className="chosen">
                  {choice.options[chose]}
                </span>
                {' or '}
                <span className="unchosen">
                  {choice.options[(chose + 1) % 2]}
                </span>
                {'?'}
              </p>
            )
          }
        })()}
      </section>
    )
    return question
  }
  const [currentIndex] = useState(Math.min(
    choices.length - 1, qIndex ?? progress?.length ?? 0
  ))
  const link = useCallback((
    index: number | string,
    { progress: argProgress }: LinkParams = {}
  ) => {
    const linkParams: URLParams = {}
    Object.entries(
      {
        index: index != null ? String(index) : null,
        state: progress2state(argProgress ?? progress),
        seed,
      }
    ).map(([key, value]) => {
      if(value) {
        linkParams[key as keyof URLParams] = (
          value
        )
      }
    })
    const query = new URLSearchParams(linkParams)
    return `?${query.toString()}`
  }, [progress, seed])

  useEffect(() => {
    const key = (evt: KeyboardEvent) => {
      if(evt.key === '1' || evt.key === '2') {
        const choice = (Number(evt.key) - 1) as Choice
        const progress = (
          choose({ at: currentIndex, choice })
        )
        window.location.href = (
          link(currentIndex + 2, { progress })
        )
      } else if(evt.key === 'ArrowLeft') {
        if(currentIndex >= 0) {
          window.location.href = (
            link(currentIndex, { progress })
          )
        }
      } else if(evt.key === 'ArrowRight') {
        if(currentIndex < choices.length) {
          window.location.href = (
            link(currentIndex + 2, { progress })
          )
        }
      }
    }
    document.addEventListener('keyup', key)
    return () => {
      document.removeEventListener('keyup', key)
    }
  }, [choices.length, choose, currentIndex, link, progress])

  return (
    <main>
      <h1>MBTI Inventory</h1>

      <ol id="progress">
        {choices.map(
          (_entry: Pair | Question, idx: number) => {
            if(idx >= choices.length) return null

            const choice = progress?.[idx]
            const known = choice != null

            const q = format(
              { choice: choices[idx], chose: choice }
            )

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
                <a href={`${link(idx + 1)}`}>
                  {idx + 1}
                </a>
              </li>
            )
          }
        )}
      </ol>

      {qIndexString === 'score' ? (
        <Score {...{ choices, progress }}/>
      ) : (
        <Prompt
          index={currentIndex}
          chosen={progress?.[currentIndex]}
          {...{ choices, link, choose }}
        />
      )}

      <section id="legend">
        <p>Click on any of the numbered boxes to select that question.</p>
        <p>Use the left and right arrow keys to navigate between questions.</p>
        <p>Use the 1 and 2 keys to select the first or second option.</p>
        <p>Use the up and down keys to select an option, and enter to progress.</p>
      </section>

      <Tooltip id="tooltip"/>
    </main>
  )
}

export default App
