import { useEffect, useState } from 'react'

/**
 * Buffers a numeric <input> as local text so the field can be fully
 * backspaced to blank while typing, instead of snapping back to "0".
 * `onChange` (numeric) only fires once the text parses to a valid number.
 */
export function useNumberInputState(value: number, onChange: (v: number) => void) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    if (Number(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw === '' || raw === '-' || raw === '.') return
    const n = Number(raw)
    if (!Number.isNaN(n)) onChange(n)
  }

  const handleBlur = () => {
    if (text === '' || text === '-' || Number.isNaN(Number(text))) {
      setText('0')
      onChange(0)
    }
  }

  return { text, handleChange, handleBlur }
}

/**
 * Same as above but for components whose onChange contract passes the raw
 * string up (parent does its own Number(v) conversion).
 */
export function useNumberTextInputState(value: number | string, onChange: (v: string) => void) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    if (Number(text) !== Number(value)) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw === '' || raw === '-' || raw === '.') return
    onChange(raw)
  }

  const handleBlur = () => {
    if (text === '' || text === '-' || Number.isNaN(Number(text))) {
      setText('0')
      onChange('0')
    }
  }

  return { text, handleChange, handleBlur }
}
