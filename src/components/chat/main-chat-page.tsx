import Image from "next/image";
import ChatInput from "./chat-input";

export default function MainContent() {
  return (
    <div className="flex-1 flex flex-col gap-12 items-center h-full justify-center w-full">
      <div className="flex flex-col w-[40rem] gap-4 items-center text-center">
        <Image
          alt="logo kabupaten"
          src={"/Logo_kabupaten_madiun.png"}
          width={100}
          height={100}
        />
        <h1 className="heading-1 text-wrap">
          Portal Informasi Publik Kabupaten Madiun
        </h1>
      </div>
      <ChatInput />
    </div>
  );
}
