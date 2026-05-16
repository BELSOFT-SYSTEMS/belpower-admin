export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );
}
