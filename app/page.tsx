

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "./supabase";
type WasteReport = {
  id: number;
  title: string;
  location: string;
  category: string;
  severity: string;
  status: string;
  photo_path: string | null;
};

const initialReports: WasteReport[] = [
  {
    id: 1,
    title: "Overflowing public dustbin",
    location: "Main Gate",
    category: "Overflowing Bin",
    severity: "High",
    status: "Pending",
    photo_path: null,
  },
  {
    id: 2,
    title: "Plastic waste near the canteen",
    location: "College Canteen",
    category: "Plastic Waste",
    severity: "Medium",
    status: "In Progress",
    photo_path: null,
  },
  {
    id: 3,
    title: "Litter around the parking area",
    location: "Parking Zone",
    category: "Littering",
    severity: "Low",
    status: "Resolved",
    photo_path: null,
  },
];

export default function Home() {
  const [reports, setReports] = useState<WasteReport[]>(initialReports);
  
  useEffect(() => {
    async function loadReports() {
      const { data, error } = await supabase
        .from("waste_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading reports:", error);
        setMessage("Could not load reports from the database.");
        return;
      }

      if (data) {
        setReports(
          data.map((report) => ({
            id: Number(report.id),
            title: report.title,
            location: report.location,
            category: report.category,
            severity: report.severity,
            status: report.status,
            photo_path: report.photo_path ?? null,
          }))
        );
      }
    }

    loadReports();
  }, []);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Overflowing Bin");
  const [severity, setSeverity] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!title.trim() || !location.trim()) {
    setMessage("Please enter a title and location.");
    return;
  }

  if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) {
    setMessage("Photo must be smaller than 5 MB.");
    return;
  }

  let photoPath: string | null = null;

  if (selectedPhoto) {
    const fileExtension = selectedPhoto.name.split(".").pop();
    const filePath = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("waste-photos")
      .upload(filePath, selectedPhoto);

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      setMessage("Could not upload photo. Please try again.");
      return;
    }

    photoPath = uploadData.path;
  }

  const { data, error } = await supabase
    .from("waste_reports")
    .insert([
      {
        title: title.trim(),
        location: location.trim(),
        category,
        severity,
        status: "Pending",
        photo_path: photoPath,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving report:", error);
    setMessage("Could not save report. Please try again.");
    return;
  }

  const newReport: WasteReport = {
    id: Number(data.id),
    title: data.title,
    location: data.location,
    category: data.category,
    severity: data.severity,
    status: data.status,
    photo_path: data.photo_path ?? null,
  };

  setReports((previous) => [newReport, ...previous]);
  setTitle("");
  setLocation("");
  setCategory("Overflowing Bin");
  setSeverity("Medium");
  setSelectedPhoto(null);
  setMessage("Your waste report was saved successfully!");
}



  
async function updateStatus(id: number) {
  const nextStatus: Record<string, string> = {
    Pending: "In Progress",
    "In Progress": "Resolved",
    Resolved: "Pending",
  };

  const report = reports.find((item) => item.id === id);

  if (!report) return;

  const updatedStatus = nextStatus[report.status];

  const { error } = await supabase
    .from("waste_reports")
    .update({ status: updatedStatus })
    .eq("id", id);

  if (error) {
    console.error("Error updating status:", error);
    setMessage("Could not update status. Please try again.");
    return;
  }

  setReports((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, status: updatedStatus }
        : item
    )
  );

  setMessage("Report status updated successfully!");
}

  const visibleReports =
    filter === "All"
      ? reports
      : reports.filter((report) => report.status === filter);

  const pending = reports.filter((r) => r.status === "Pending").length;
  const inProgress = reports.filter(
    (r) => r.status === "In Progress"
  ).length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#203329]">
      <header className="border-b border-[#dfe7dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#245c43] text-2xl text-white">
              ♻
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                EcoTrack
              </h1>
              <p className="text-xs text-gray-500">
                Community Waste Intelligence
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#e7f3e9] px-4 py-2 text-sm font-semibold text-[#245c43]">
            ● Live Dashboard
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-9">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#52805f]">
            Cleaner places start with us
          </p>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            Small reports.{" "}
            <span className="text-[#43845a]">Cleaner communities.</span>
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600">
            Report overflowing bins and litter, track cleanup progress,
            and help make your neighbourhood cleaner.
          </p>
        </div>

        <div className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Reports" value={reports.length} symbol="📋" />
          <StatCard label="Pending" value={pending} symbol="⏳" />
          <StatCard label="In Progress" value={inProgress} symbol="🧹" />
          <StatCard label="Resolved" value={resolved} symbol="🌱" />
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-[#e1e8df] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Report a waste issue</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Tell us what needs attention and where it is located.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Issue title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Overflowing dustbin"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#43845a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. College canteen"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#43845a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Waste category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <option>Overflowing Bin</option>
                  <option>Plastic Waste</option>
                  <option>Littering</option>
                  <option>Food Waste</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Low", "Medium", "High"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                        severity === level
                          ? "border-[#245c43] bg-[#e7f3e9] text-[#245c43]"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

           
<div className="mb-4">
  <label htmlFor="photo" className="mb-2 block text-sm font-semibold">
    Upload Waste Photo
  </label>

  <input
    id="photo"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) =>
      setSelectedPhoto(e.target.files?.[0] ?? null)
    }
    className="w-full rounded-xl border border-gray-200 p-3"
  />

  <p className="mt-1 text-sm text-gray-500">
    JPG, PNG, or WebP — Maximum 5 MB
  </p>
</div>

<button
  type="submit"
  className="w-full rounded-xl bg-[#245c43] px-5 py-3.5 font-bold text-white transition hover:bg-[#194630]"
>
  + Submit Report
</button>
```


              {message && (
                <p className="text-sm text-[#245c43]" role="status">
                  {message}
                </p>
              )}
            </form>
          </section>

          <section className="rounded-3xl border border-[#e1e8df] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Community Reports</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Monitor issues and update their progress.
                </p>
                  
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                aria-label="Filter reports by status"
              >
                <option>All</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {visibleReports.length === 0 && (
                <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                  No reports found for this filter.
                </p>
              )}

              {visibleReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-gray-100 p-5 transition hover:border-[#c7dac9]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#52805f]">
                        {report.category}
                      </span>
                      <h4 className="mt-2 font-bold">{report.title}</h4>
                      <p className="mt-2 text-sm text-gray-500">
                        📍 {report.location}
                      </p>
                      
                      {report.photo_path && (
                        <ReportPhoto path={report.photo_path} />
                      )}
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-500">
                      Severity:{" "}
                      <strong className="text-gray-700">
                        {report.severity}
                      </strong>
                    </span>
                    <button
                      onClick={() => updateStatus(report.id)}
                      className="rounded-lg bg-[#edf4ed] px-3 py-2 text-sm font-semibold text-[#245c43] hover:bg-[#dcebdd]"
                    >
                      Update status →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-10 border-t border-[#dfe7dc] py-6 text-center text-sm text-gray-500">
          EcoTrack · Building cleaner communities, one report at a time.
        </footer>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  symbol,
}: {
  label: string;
  value: number;
  symbol: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e8df] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="text-xl">{symbol}</span>
      </div>
      <p className="mt-4 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700",
    "In Progress": "bg-blue-50 text-blue-700",
    Resolved: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

  
function ReportPhoto({ path }: { path: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPhoto() {
      const { data, error } = await supabase.storage
        .from("waste-photos")
        .createSignedUrl(path, 3600);

      if (error) {
        console.error("Could not load report photo:", error);
        return;
      }

      if (active) {
        setPhotoUrl(data.signedUrl);
      }
    }

    loadPhoto();

    return () => {
      active = false;
    };
  }, [path]);

  if (!photoUrl) return null;

  return (
    <img
      src={photoUrl}
      alt="Uploaded waste report"
      className="mt-4 max-h-64 w-full rounded-xl object-cover"
    />
  );
}


  


  



  
