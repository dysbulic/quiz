import { Choice, Pair, Question } from "./App";

export const Score = (
  { choices, progress }:
  {
    choices: Array<Question | Pair>,
    progress: Array<Choice>
  }
) => {
  const scores = choices.map((entry, idx) => {
    const axes = entry.axis.split('/')
    const choice = progress[idx]
    return choice == null ? null : axes[choice]
  })
  .filter((score) => score != null)

  const acc = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
  }
  scores.forEach((score) => {
    acc[score as keyof typeof acc] += 1
  })

  return (
    <section id="score">
      <ul>
        <li>
          <span>
            <strong>E</strong>xtroversion
            / <strong>I</strong>ntroversion
          </span>
          <span>{acc.E} / {acc.I}</span>
          <span>
            {acc.E > acc.I ? 'E' : 'I'}
            {' '}({Math.abs(acc.E - acc.I)})
          </span>
        </li>
        <li>
          <span>
            <strong>S</strong>ensing
            / i<strong>N</strong>tuitive
          </span>
          <span>{acc.S} / {acc.N}</span>
          <span>
            {acc.S > acc.N ? 'S' : 'N'}
            {' '}({Math.abs(acc.S - acc.N)})
          </span>
        </li>
        <li>
          <span>
            <strong>T</strong>hinking
            / <strong>F</strong>eeling
          </span>
          <span>{acc.T} / {acc.F}</span>
          <span>
            {acc.T > acc.F ? 'T' : 'F'}
            {' '}({Math.abs(acc.T - acc.F)})
          </span>
        </li>
        <li>
          <span>
            <strong>J</strong>udging
            / <strong>P</strong>erceiving
          </span>
          <span>{acc.J} / {acc.P}</span>
          <span>
            {acc.J > acc.P ? 'J' : 'P'}
            {' '}({Math.abs(acc.J - acc.P)})
          </span>
        </li>
      </ul>
    </section>
  )
}