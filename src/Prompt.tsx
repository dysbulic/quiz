import React from "react"
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
  return (
    <section id="prompt">
      <form className="question">
        {(entry as Question).question && (
          <p>{(entry as Question).question}</p>
        )}
        <ol className="options">
          {options.map(
            (option: string, idx: number) => (
              <React.Fragment key={idx}>
                <li>
                  <label>
                    <input
                      type="radio"
                      name={`options-${index}`}
                      defaultChecked={chosen === idx}
                      onClick={() => {
                        choose({
                          at: index,
                          choice: idx as Choice,
                        })
                      }}
                    />
                    {option}
                  </label>
                  {idx === options.length - 1 && '?'}
                </li>
                {idx < options.length - 1 && (
                  <li className="or">or</li>
                )}
              </React.Fragment>
            )
          )}
        </ol>
      </form>
      {index < choices.length - 1 ? (
        <a href={link(index + 2)}>Next →</a>
      ) : (
        <a href={link('score')}>Score →</a>
      )}
    </section>
  )
}