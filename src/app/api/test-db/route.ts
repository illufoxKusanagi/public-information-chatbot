import { insertRagData } from "@/lib/db/index";
import { NextResponse } from "next/server";
const ragDataToInsert = [
  {
    data: {
      type: "pejabat",
      name: "Tontro Pahlawanto",
      first_degree: "Ir.",
      last_degree: "",
      position: "Sekretaris Daerah",
      unit: "Sekretariat Daerah",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Mohamad Hadi Sutikno",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Kepala Badan",
      unit: "Badan Pendapatan Daerah",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Sodik Hery Purnomo",
      first_degree: "",
      last_degree: "S.Si",
      position: "Asisten",
      unit: "Asisten Perekonomian dan Pembangunan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Kurnia Aminulloh",
      first_degree: "",
      last_degree: "SH",
      position: "Kepala Badan",
      unit: "Badan Perencanaan Pembangunan Daerah",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Anang Sulistijono",
      first_degree: "",
      last_degree: "S.Sos., M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Pariwisata, Pemuda dan Olah Raga",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Indra Setyawan",
      first_degree: "",
      last_degree: "SE, M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Perdagangan, Koperasi, dan Usaha Mikro",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Siti Zubaidah",
      first_degree: "Dra.",
      last_degree: "M.H",
      position: "Kepala Dinas",
      unit: "Dinas Pendidikan dan Kebudayaan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Joko Lelono",
      first_degree: "",
      last_degree: "AP, M.H",
      position: "Inspektur",
      unit: "Inspektorat Daerah",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Yudi Hartono",
      first_degree: "",
      last_degree: "S.Sos, MM",
      position: "Sekretaris DPRD",
      unit: "DPRD Kabupaten Madiun",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Sawung Rehtomo",
      first_degree: "Drs.",
      last_degree: "M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Komunikasi dan Informatika",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Supriyadi",
      first_degree: "",
      last_degree: "AP., M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Perhubungan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Arik Krisdiananto",
      first_degree: "",
      last_degree: "S.STP., M.H.",
      position: "Kepala Dinas",
      unit: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Didik Harianto",
      first_degree: "",
      last_degree: "S.Sos, MM",
      position: "Kepala Satuan",
      unit: "Satuan Polisi Pamong Praja",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Soedjiono",
      first_degree: "Ir.",
      last_degree: "MT",
      position: "Asisten",
      unit: "Asisten Pemerintahan Dan Kesejahteraan Rakyat",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Suryanto",
      first_degree: "",
      last_degree: "SE., M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Pengendalian Penduduk dan Keluarga Berencana, Pemberdayaan Perempuan dan Perlindungan Anak",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Heru Kuncoro",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Kepala Badan",
      unit: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Hendro Suwondo",
      first_degree: "Drs.",
      last_degree: "M.Pd",
      position: "Staf Ahli",
      unit: "Staf Ahli Bidang Kemasyarakatan dan Sumber Daya Manusia",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Mashudi",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Kepala Badan",
      unit: "Badan Kesatuan Bangsa dan Politik",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Puji Rahmawati",
      first_degree: "",
      last_degree: "S.Sos., M.Si",
      position: "Staf Ahli",
      unit: "Staf Ahli Bidang Ekonomi Pembangunan Dan Keuangan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Yohanes Cahyono",
      first_degree: "",
      last_degree: "S.Sos., M.Si",
      position: "Staf Ahli",
      unit: "Staf Ahli Bidang Pemerintahan Hukum Dan Politik",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Achmad Romadhon",
      first_degree: "",
      last_degree: "SH",
      position: "Asisten",
      unit: "Asisten Administrasi Umum",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Muhamad Zahrowi",
      first_degree: "",
      last_degree: "AP",
      position: "Kepala Dinas",
      unit: "Dinas Lingkungan Hidup",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Imam Nurwedi",
      first_degree: "",
      last_degree: "S.Sos",
      position: "Kepala Dinas",
      unit: "Dinas Tenaga Kerja",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Supriadi",
      first_degree: "Drs.",
      last_degree: "S.Sos",
      position: "Kepala Dinas",
      unit: "Dinas Pemberdayaan Masyarakat dan Desa",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Paryoto",
      first_degree: "",
      last_degree: "SP",
      position: "Kepala Dinas",
      unit: "Dinas Ketahanan Pangan dan Peternakan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Gunawi",
      first_degree: "Ir.",
      last_degree: "",
      position: "Kepala Dinas",
      unit: "Dinas Pekerjaan Umum dan Penataan Ruang",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Hari Pitojo",
      first_degree: "",
      last_degree: "ST",
      position: "Kepala Dinas",
      unit: "Dinas Perumahan dan Kawasan Permukiman",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Sigit Budiarto",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Kependudukan dan Pencatatan Sipil",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Agung Tri Widodo",
      first_degree: "",
      last_degree: "S.KM",
      position: "Kepala Dinas",
      unit: "Dinas Kesehatan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Kus Hendrawan",
      first_degree: "",
      last_degree: "SH, M.Si",
      position: "Kepala Dinas",
      unit: "Dinas Perpustakaan dan Kearsipan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Suntoko",
      first_degree: "",
      last_degree: "S.Sos., M.Si",
      position: "Kepala Badan",
      unit: "Badan Pengelolaan Keuangan dan Aset Daerah",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Sumanto",
      first_degree: "",
      last_degree: "SP., MMA",
      position: "Kepala Dinas",
      unit: "Dinas Pertanian dan Perikanan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Agung Budiarto",
      first_degree: "Drs.",
      last_degree: "",
      position: "Plt. Kepala Dinas",
      unit: "Dinas Sosisl",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Boby Saktia Putra Lubis",
      first_degree: "",
      last_degree: "ST",
      position: "Kepala Pelaksana",
      unit: "Badan Penanggulangan Bencana",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Junaidi",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Kepala Bagian",
      unit: "Bagian Administrasi Pembangunan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Alif Margianto",
      first_degree: "",
      last_degree: "SH., M.Hum",
      position: "Kepala Bagian",
      unit: "Bagian Hukum",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Mohammad Jazuli",
      first_degree: "",
      last_degree: "SE",
      position: "Kepala Bagian",
      unit: "Bagian Kesejahteraan Rakyat",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Sri Diana Dewi Kusumaningrum",
      first_degree: "",
      last_degree: "SH. M.Si",
      position: "Kepala Bagian",
      unit: "Bagian Organisasi",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "R. Ndaru Kendaryanto",
      first_degree: "",
      last_degree: "ST, MM",
      position: "Kepala Bagian",
      unit: "Bagian Pemerintahan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "A. Heru Sulaksono",
      first_degree: "",
      last_degree: "ST., MM",
      position: "Kepala Bagian",
      unit: "Bagian Pengadaan Barang/Jasa",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Puji Satriyo",
      first_degree: "",
      last_degree: "SE., M.Si",
      position: "Kepala Bagian",
      unit: "Bagian Perekonomian dan Sumber Daya Alam",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Toni Eko Prasetyo",
      first_degree: "",
      last_degree: "SE., M.Si",
      position: "Kepala Bagian",
      unit: "Bagian Protokol dan Komunikasi Pimpinan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Eryk Sanjaya",
      first_degree: "",
      last_degree: "AP",
      position: "Kepala Bagian",
      unit: "Bagian Umum",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Bibit Purwanto",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Camat",
      unit: "Kecamatan Mejayan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Tarji",
      first_degree: "",
      last_degree: "S.STP, M.H",
      position: "Camat",
      unit: "Kecamatan Dagangan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Heri Kurniawan",
      first_degree: "",
      last_degree: "S.STP, M.Si",
      position: "Camat",
      unit: "Kecamatan Wonoasri",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Tarnu Ashidiq",
      first_degree: "",
      last_degree: "S.Ag., M.Si",
      position: "Camat",
      unit: "Kecamatan Kebonsari",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Hariono",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Camat",
      unit: "Kecamatan Madiun",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Hery Fajar Nugroho",
      first_degree: "",
      last_degree: "S.Sos, M.Si",
      position: "Camat",
      unit: "Kecamatan Dolopo",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Basudewo Aji Pamungkas",
      first_degree: "",
      last_degree: "SE.M.Si",
      position: "Camat",
      unit: "Kecamatan Pilangkenceng",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Alviantoro",
      first_degree: "",
      last_degree: "S.STP.M.H",
      position: "Camat",
      unit: "Kecamatan Kare",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Muhammad Sholeh",
      first_degree: "",
      last_degree: "S.Sos. M.si",
      position: "Camat",
      unit: "Kecamatan Sawahan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Eko Suwartono",
      first_degree: "Drs.",
      last_degree: "",
      position: "Camat",
      unit: "Kecamatan Wungu",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Djoko Susilo",
      first_degree: "",
      last_degree: "S.Sos",
      position: "Camat",
      unit: "Kecamatan Gemarang",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Raswiyanto",
      first_degree: "",
      last_degree: "SH",
      position: "Camat",
      unit: "Kecamatan Jiwan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Aksin Muharom",
      first_degree: "",
      last_degree: "S.Sos",
      position: "Camat",
      unit: "Kecamatan Balerejo",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Dodi Setiawan",
      first_degree: "",
      last_degree: "S.IP, MH",
      position: "Camat",
      unit: "Kecamatan Saradan",
    },
  },
  {
    data: {
      type: "pejabat",
      name: "Puguh Wijayanto",
      first_degree: "",
      last_degree: "S.STP",
      position: "Camat",
      unit: "Kecamatan Geger",
    },
  },
];

export async function POST() {
  try {
    const result = await insertRagData(ragDataToInsert);

    if (result.success) {
      return NextResponse.json({
        status: "success",
        message: `${result.count} records inserted successfully.`,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to insert data into the database.",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "An unexpected error occurred.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
