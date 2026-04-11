import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "صحة (Seha) — تطبيق المريض",
  description: "منصة صحة: إدارة الوصفات الطبية الرقمية",
};

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
