import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <div className="flex flex-row gap-4 h-screen p-16">
      <div className="flex flex-col gap-4 w-1/4">
        <p className="heading-1">Pusat Bantuan</p>
        <p className="body-small-regular">
          Jika anda memiliki masalah lain, anda dapat menghubungi{" "}
          <span className="body-small-bold hover:underline">
            <Link href={"mailto: ariefsatria2409@gmail.com"} target="_blank">
              email kami
            </Link>
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-2 w-3/4">
        {/* NUMBER 1 */}
        <p className="heading-3">1. Memulai (Getting Started)</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Bagaimana cara menggunakan aplikasi ini?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Anda bisa langsung mengetikkan pertanyaan di kolom chat di
                halaman utama untuk bertanya langsung pada chatbot kami.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Apa fungsi utama dari aplikasi ini?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Aplikasi ini dirancang untuk menjadi pusat informasi lengkap
                seputar Kabupaten Madiun. Fungsi utamanya adalah memberikan
                jawaban cepat melalui chatbot dan menyediakan direktori
                terstruktur untuk semua kebutuhan informasi Anda tentang Madiun.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Apakah saya perlu membuat akun untuk mengunakan aplikasi ini?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Tidak wajib! Anda bisa langsung mengakses sebagian besar
                informasi tanpa akun. Namun, dengan mendaftar, Anda bisa
                menggunakan fitur riwayat pesan untuk menyimpan pertanyaan dan
                jawaban yang telah Anda tanyakan sebelumnya.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* NUMBER 2 */}
        <p className="heading-3">2. Menggunakan Fitur Chatbot</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Bagaimana cara bertanya kepada chatbot?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Cukup ketik pertanyaan Anda di kolom chat yang tersedia di
                halaman utama, lalu tekan tombol kirim. Gunakan kata kunci yang
                sederhana dan jelas untuk hasil terbaik. Contoh: &quot;Berapa
                banyak penduduk Kabupaten Madiun&quot; atau &quot;Lokasi monumen
                kresek&quot;.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Mengapa chatbot tidak mengerti atau salah menjawab pertanyaan
              saya?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Chatbot kami terus belajar. Coba ulangi pertanyaan Anda dengan
                kalimat yang lebih sederhana atau gunakan kata kunci yang
                berbeda. Apabila chatbot tidak menjawab pertanyaan anda, Anda
                dapat mengecek informasi di &quot;....link ppid&quot;
                melaporkannya melalui menu &quot;Beri Masukan&quot;.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Bisakah saya menggunakan perintah suara (voice command)?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Saat ini fitur perintah suara sedang dalam pengembangan. Untuk
                sekarang, silakan gunakan input teks untuk berinteraksi dengan
                chatbot.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* NUMBER 3 */}
        <p className="heading-3">3. Cara Kerja Chatbot & Sumber Informasi</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Dari mana chatbot ini mendapatkan semua jawabannya?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Chatbot ini terhubung langsung ke basis data resmi yang dikelola
                oleh Dinas Komunikasi dan Informatika (Diskominfo) Kabupaten
                Madiun. Setiap jawaban yang Anda terima dihasilkan dari dokumen,
                data, dan informasi yang valid di dalam basis data tersebut.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Mengapa chatbot menjawab &quot;Saya tidak dapat menemukan
              informasi mengenai itu di dalam basis data&quot;?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Jawaban ini muncul karena sistem kami tidak menemukan dokumen
                atau data yang cocok dengan kata kunci pertanyaan Anda di dalam
                database Diskominfo. Hal ini bisa terjadi jika: Informasi
                tersebut memang belum tersedia secara digital. Anda menggunakan
                istilah atau singkatan yang tidak umum. Solusi: Coba ajukan
                pertanyaan dengan kalimat yang berbeda atau gunakan kata kunci
                yang lebih umum.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Apakah informasi dari chatbot ini 100% akurat dan terbaru?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Informasi kami seakurat dan semutakhir data yang ada di database
                Diskominfo. Chatbot secara otomatis menggunakan data terbaru
                yang tersedia. Namun, mungkin ada jeda waktu antara penetapan
                kebijakan baru di lapangan dengan proses digitalisasi data ke
                dalam sistem.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>
              Apakah chatbot ini bisa memberikan opini atau informasi di luar
              data Diskominfo?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Tidak. Chatbot ini dirancang murni sebagai asisten informasi
                faktual berbasis data. Ia tidak memiliki opini, tidak bisa
                membuat prediksi, dan tidak akan memberikan jawaban atas
                topik-topik yang tidak tercatat dalam basis data resmi Pemkab
                Madiun.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* NUMBER 4 */}
        <p className="heading-3">4. Akses & Kendala Teknis </p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Halaman chatbot tidak merespons atau macet. Apa yang harus saya
              lakukan?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Pertama, coba segarkan (refresh) halaman browser Anda (biasanya
                dengan menekan tombol F5 atau Ctrl+R untuk PC, dan seret ke
                bawah untuk HP). Jika tidak berhasil, coba bersihkan cache
                browser Anda atau akses menggunakan browser yang berbeda (kami
                merekomendasikan Google Chrome atau Mozilla Firefox versi
                terbaru).
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Mengapa beberapa fitur tampilan terlihat aneh di browser saya?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Website chatbot ini dioptimalkan untuk browser modern. Pastikan
                browser yang Anda gunakan sudah diperbarui ke versi terbaru.
                Menggunakan browser yang sangat lama mungkin dapat menyebabkan
                masalah tampilan.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* NUMBER 5 */}
        <p className="heading-3">3. Cara Kerja Chatbot & Sumber Informasi</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Apakah riwayat percakapan saya dengan chatbot akan tersimpan?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Jika Anda tidak login (pengguna tamu): Percakapan hanya bersifat
                sementara dan akan hilang secara permanen saat Anda menutup
                halaman atau browser. Jika Anda sudah login: Tentu! Seluruh
                riwayat percakapan Anda akan kami simpan secara otomatis di akun
                Anda.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Di mana saya bisa melihat kembali riwayat percakapan saya yang
              tersimpan?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Pastikan Anda sudah login terlebih dahulu. Kemudian, masuk ke
                menu &quot;Riwayat&quot; di sidebar. Di sana Anda akan menemukan
                daftar semua percakapan yang telah Anda lakukan dengan chatbot,
                lengkap dengan tanggal dan waktu. Anda bisa mengklik setiap
                entri untuk melihat detail percakapan tersebut.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Apakah riwayat percakapan saya yang tersimpan itu aman dan privat?
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance body-small-regular">
              <p>
                Tentu. Kami menjaga privasi Anda dengan serius. Riwayat
                percakapan Anda terenkripsi dan hanya bisa diakses oleh Anda
                setelah login ke akun Anda. Riwayat ini kami gunakan hanya untuk
                memudahkan Anda melihat kembali informasi yang pernah Anda cari,
                dan tidak akan dibagikan ke pihak lain sesuai dengan kebijakan
                privasi kami.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
