export default function FormField({ label, hint, error, required, children, id }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && <p className="form-hint">{hint}</p>}
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
