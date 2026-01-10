const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex gap-2">
        <span className="w-3 h-3 bg-gray-900 rounded-full animate-bounce" />
        <span className="w-3 h-3 bg-gray-900 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-3 h-3 bg-gray-900 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
};

export default FullPageLoader;
