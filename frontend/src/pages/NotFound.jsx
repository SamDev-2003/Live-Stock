import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-7xl mb-4">🐄</div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Oops! This page has wandered off to the pasture.</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
