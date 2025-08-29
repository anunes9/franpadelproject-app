import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600">There was an error with your authentication. Please try again.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </Link>

          <p className="text-sm text-gray-500">
            If you continue to have issues, please{' '}
            <a
              href="https://franpadelproject.com/contact"
              className="text-blue-600 hover:text-blue-500 underline"
              target="_blank"
              rel="noreferrer"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
