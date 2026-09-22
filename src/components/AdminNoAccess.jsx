import { Link } from 'react-router-dom'
import Header from './Header'

export default function AdminNoAccess() {
  return (
    <>
      <Header title="Admin" backTo="/dashboard" />

      <main className="page">
        <div className="card mt-md text-center">
          <h2 className="mb-md">No access</h2>
          <p className="mb-md">
            Your account does not have permission to view the admin area.
          </p>
          <Link to="/dashboard" className="btn btn--primary">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </>
  )
}
