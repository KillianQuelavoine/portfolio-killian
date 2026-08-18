interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
}

export function Stepper({ label, value, onChange, step = 5, min = 0, max = 3600, suffix = 'sec' }: StepperProps) {
  const update = (next: number) => onChange(Math.max(min, Math.min(max, Math.round(next || 0))))
  return (
    <div className="stepper-row">
      <label className="stepper-label" htmlFor={`field-${label}`}>{label}</label>
      <div className="stepper-control">
        <button type="button" className="step-button" onClick={() => update(value - step)} disabled={value <= min} aria-label={`Diminuer ${label}`}>−</button>
        <div className="stepper-value">
          <input
            id={`field-${label}`}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            onChange={(event) => update(Number(event.target.value))}
            aria-label={`${label} en ${suffix}`}
          />
          <span>{suffix}</span>
        </div>
        <button type="button" className="step-button" onClick={() => update(value + step)} disabled={value >= max} aria-label={`Augmenter ${label}`}>+</button>
      </div>
    </div>
  )
}
