import ChatInput from "./chat-input";

export default function MainContent() {
  return (
    <div className="flex-1 flex flex-col gap-8 items-center h-full justify-center w-full">
      <div className="flex flex-col w-[40rem] gap-4 text-center">
        <p className="body-bigger-bold">Selamat Datang!!</p>
        <h1 className="title-regular text-wrap">
          Di Portal Informasi Publik Kabupaten Madiun
        </h1>
      </div>
      <ChatInput />
    </div>
  );
}
