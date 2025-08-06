"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";

function MainContent() {
  return (
    <div className="flex-1 flex flex-col gap-4 items-center h-full justify-center w-full">
      <div className="flex flex-col w-[40rem] gap-4 text-center">
        <p className="body-bigger-bold">Selamat Datang!!</p>
        <h1 className="title-regular text-wrap">
          Di Portal Informasi Publik Kabupaten Madiun
        </h1>
        <p className="body-big-regular">Silahkan tanyakan apapun</p>
      </div>
      <div className="flex flex-row h-24 w-5xl rounded-xl justify-between outline-3 px-6 py-3 outline-cyan-400 ">
        <div className="flex flex-col justify-between">
          <p className=" text-grey-400">masukkan pertanyaan</p>
          <div className="flex flex-row gap-8">
            <p>Template Pertanyaan</p>
            <p>FAQ</p>
          </div>
        </div>
        <div className="flex items-center bg-sky-300">
          <p>this is send button</p>
        </div>
      </div>
    </div>
  );
}

function TextArea() {
  return <div></div>;
}

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row h-full w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <SidebarTrigger className="absolute top-4 left-4 z-20" />
            <MainContent />
          </main>
        </div>
      </SidebarProvider>
      <footer className="flex flex-col w-full items-center absolute bottom-0">
        <p>Made with 💗 by Illufox Kasunagi</p>
      </footer>
    </div>
  );
}
