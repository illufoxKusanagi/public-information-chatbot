export default function Page() {
  return (
    <div className="flex flex-col h-screen">
      <header className="row-start-1 flex items-center justify-between p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">Chat Application</h1>
      </header>
      <main className="row-start-2 flex-1 p-4 overflow-y-auto">
        <p className="text-gray-100">
          Welcome to the chat application! Start a conversation with your
          friends.
        </p>
        {/* Additional content can be added here */}
        <p className="mt-4 text-gray-100">
          This is a simple chat interface built with React and Tailwind CSS.
        </p>
      </main>
      <footer className="row-start-3 flex items-center justify-center p-4 bg-gray-800 text-white">
        <p>Made with 💗 by illufox kasunagi</p>
      </footer>
    </div>
  );
}
