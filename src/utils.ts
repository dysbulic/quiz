import { MersenneTwister } from 'fast-mersenne-twister'

export function shuffle<T = unknown>(
  arr: Array<T>,
  { seed = crypto.randomUUID() as string },
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const { random } = new MersenneTwister(seed) as {
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