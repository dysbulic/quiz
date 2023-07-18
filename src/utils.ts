import { MersenneTwister } from 'fast-mersenne-twister'
import { Maybe } from './App';

export function shuffle<T = unknown>(
  arr: Array<T>,
  { seed }: { seed: Maybe<string> } = { seed: null }
) {
  if(seed == null) {
    seed = crypto.getRandomValues(
      new Uint32Array(1)
    ).toString()
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const { random } = new MersenneTwister(Number(seed)) as {
    random: () => number
  }
  let currIdx = arr.length, randIdx

  while(currIdx > 0) {
    randIdx = Math.floor(random() * currIdx)
    currIdx--
    ;[arr[currIdx], arr[randIdx]] = (
      [arr[randIdx], arr[currIdx]]
    )
  }

  return arr
}

export function sequence(max: number) {
  return Array.from({ length: max }, (_, i) => i)
}

export const state2progress = (state?: Maybe<string>) => {
  if(state == null) return []

  try {
    let bits: Maybe<Array<string>> = Array.from(
      atob(state.padEnd(Math.ceil(state.length / 4) * 4, '='))
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

export const progress2state = (
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
      const string = bits.join('')
      const state = (
        string
        .padEnd(Math.ceil(string.length / 8) * 8, '0')
        .match(/.{1,8}/g)
        ?.map((byte) => (
          String.fromCharCode(parseInt(byte, 2))
        ))
        .join('')
      ) as string
      const out = btoa(state ?? '').replace(/=/g, '')

      return out || null
    } catch(err) {
      console.error((err as Error).message)
    }

    return null
  }
)
