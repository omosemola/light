export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" />
      </div>
      <p className="mt-4 text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-300 tracking-wider">
        Loading Lightson...
      </p>
    </div>
  );
}
