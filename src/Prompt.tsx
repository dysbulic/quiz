import React, { FormEvent } from "react"
import { Choice, Pair, Question } from "./App"

export const Prompt = (
  { chosen, index, choices, choose, link }:
  {
    index: number
    chosen: Choice
    choices: Array<Pair | Question>
    choose: (
      (choice: { at: number, choice: Choice }) => void
    )
    link: (to: number | 'score') => string
  }
) => {
  const entry = choices[index]
  const options = entry.options ?? entry
  const last = index >= choices.length - 1
  const onSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const next = last ? 'score' : index + 2
    location.href = link(next)
  }

  return (
    <section id="prompt">
      <form className="question" {...{ onSubmit }}>
        {(entry as Question).question && (
          <p>{(entry as Question).question}</p>
        )}
        <ol className="options">
          {options.map(
            (option: string, idx: number) => (
              <React.Fragment key={idx}>
                <li>
                  <label>
                    ({idx + 1}){' '}
                    <input
                      type="radio"
                      name={`options-${index}`}
                      checked={chosen === idx}
                      onChange={() => {
                        choose({
                          at: index,
                          choice: idx as Choice,
                        })
                      }}
                    />
                    {option}
                    {idx === options.length - 1 && '?'}
                  </label>
                </li>
                {idx < options.length - 1 && (
                  <li className="or">or</li>
                )}
              </React.Fragment>
            )
          )}
        </ol>
        <button>{last ? 'Score' : 'Next'} →</button>
      </form>
    </section>
  )
}