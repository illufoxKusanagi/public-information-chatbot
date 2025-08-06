export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">Chat Application</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {/* Chat content will go here */}
        <p>Welcome to the chat application!</p>
      </main>
      <footer className="flex items-center justify-center p-4 bg-gray-800 text-white">
        <p>Made with 💗 by illufox kasunagi</p>
      </footer>
    </div>
  );
}
