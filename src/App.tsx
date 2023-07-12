import { z } from 'zod'
import { sequence, shuffle } from './utils'
import form from './data/Form M.json5'
import './App.css'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

type Maybe<T> = T | null

type Questions = {
  part: string
  questions: Array<{
    question: string
    options: Array<string>
  }>
}
const QuestionsSchema = z.object({
  part: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
  }))
})

type Pairs = {
  part: string
  pairs: Array<Array<string>>
}
const PairsSchema = z.object({
  part: z.string(),
  pairs: z.array(z.array(z.string())),
})

const ConfigSchema = (
  z.array(z.union([
    QuestionsSchema,
    PairsSchema,
  ]))
)

export function App() {
  const sections = ConfigSchema.parse(form)
  const groups = sections.map((sec) => (
    (sec as Questions).questions
    ?? (sec as Pairs).pairs
  ))
  const choices = groups.flat()
  const params = (
    new URLSearchParams(window.location.search)
  )
  const seq = shuffle<number>(
    sequence(choices.length),
    { seed: params.get('seed') ?? undefined },
  )
  const state = params.get('state')
  let bits: Maybe<Array<string>> = null
  if(state) {
    try {
      bits = Array.from(
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
        bits = null
      }
    } catch(err) {
      console.error((err as Error).message)
    }
  }
  const progress = (
    bits?.map((field) => {
      switch(field) {
        case '01': return 0
        case '10': return 1
        default: return null
      }
    })
  )

  const getChoice = (
    { idx, choice }:
    { idx: number, choice: Maybe<number> }
  ) => {
    return `Question #${idx + 1} (${choice ?? '?'})`
  }
  
  return (
    <main>
      <h1>MBTI Inventory</h1>

      <ol id="progress">
        {progress?.map(
          (choice: Maybe<number>, idx: number) => {
            if(idx >= seq.length) return null

            const known = choice != null
            const q = getChoice(
              { idx: seq[idx], choice }
            )
            return (
              <Tooltip key={idx}>
                <TooltipTrigger>
                  <li
                    className={
                      known ? 'known' : 'unknown'
                    }
                  >
                    {idx + 1}
                  </li>
                </TooltipTrigger>
                <TooltipContent className="tooltip">
                  {q}
                </TooltipContent>
              </Tooltip>
            )
          }
        )}
      </ol>

      <p id="bits">{bits && `0b${bits?.join('')}`}</p>
    </main>
  )
}

export default App
