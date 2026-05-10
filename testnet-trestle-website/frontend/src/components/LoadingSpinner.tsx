export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}
