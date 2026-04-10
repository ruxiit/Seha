import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-500 selection:text-white" dir="rtl">
      
      {/* Navbar overlay */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-bold border border-blue-500">
               <i className="fa-solid fa-staff-snake"></i>
             </div>
             <span className="font-bold text-xl text-slate-800 tracking-tight">صحة (Seha)</span>
         </div>
         <div className="hidden md:flex gap-6 font-semibold text-sm text-slate-600">
             <a href="#about" className="hover:text-blue-600 transition">عن المنصة</a>
             <a href="#portals" className="hover:text-blue-600 transition">البوابات الإلكترونية</a>
             <a href="#security" className="hover:text-blue-600 transition">الأمان والخصوصية</a>
         </div>
         <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-full transition-colors flex items-center gap-2">
             <i className="fa-solid fa-lock"></i> وصول حكومي
         </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-6">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 -z-10"></div>
        <div className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            النظام الوطني للوصفات الرقمية قيد العمل
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
             مستقبل الرعاية الصحية <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-emerald-500">متصل، آمن، ورقمي بالكامل.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
             منصة صحة تربط المرضى بالأطباء والصيدليات عبر شبكة وطنية مشفرة. تخلص من الوصفات الورقية، وامنع التزوير، وراقب صحتك بسهولة.
          </p>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-20 bg-white relative">
         <div className="max-w-7xl mx-auto px-6">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-slate-800 mb-4">اختر بوابتك للدخول</h2>
                 <p className="text-slate-500">أنظمة مخصصة لتجربة متكاملة حسب دورك في النظام الصحي.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 
                 {/* Patient Card */}
                 <Link href="/patient" className="group bg-slate-50 hover:bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-mobile-screen"></i>
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-3">بوابة المريض</h3>
                     <p className="text-slate-500 text-sm leading-relaxed mb-8">محفظتك الصحية الرقمية. راقب أدويتك، تتبع مواعيدك، واحصل على المساعدة من الذكاء الاصطناعي.</p>
                     <span className="mt-auto px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">الدخول للمحفظة <i className="fa-solid fa-arrow-left ml-2 text-sm"></i></span>
                 </Link>

                 {/* Doctor Card */}
                 <Link href="/doctor" className="group bg-slate-50 hover:bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-teal-200 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-user-doctor"></i>
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-3">بوابة الطبيب</h3>
                     <p className="text-slate-500 text-sm leading-relaxed mb-8">العيادة الذكية. إدارة المواعيد، معاينة التاريخ الطبي، وإصدار الوصفات الرقمية المشفرة بضغطة زر وتوليد رموز الاستجابة السريعة.</p>
                     <span className="mt-auto px-6 py-2.5 bg-teal-50 text-teal-600 font-bold rounded-full group-hover:bg-teal-600 group-hover:text-white transition-colors">دخول الطبيب <i className="fa-solid fa-arrow-left ml-2 text-sm"></i></span>
                 </Link>

                 {/* Pharmacy Card */}
                 <Link href="/pharmacy" className="group bg-slate-50 hover:bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-pills"></i>
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-3">بوابة الصيدلية</h3>
                     <p className="text-slate-500 text-sm leading-relaxed mb-8">منصة الصرف المؤطرة أمنياً. مسح الوصفات وفك التشفير إلكترونياً لضمان الموثوقية ومنع الاحتيال وتكرار الصرف.</p>
                     <span className="mt-auto px-6 py-2.5 bg-emerald-50 text-emerald-600 font-bold rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">دخول الصيدلي <i className="fa-solid fa-arrow-left ml-2 text-sm"></i></span>
                 </Link>

             </div>
         </div>
      </section>

      {/* Security Feature Section */}
      <section id="security" className="py-24 bg-slate-900 border-t border-slate-800 text-slate-300">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
             <div className="md:w-1/2">
                <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner border border-slate-700">
                   <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">أمان وتشفير حكومي المعايير</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                   يتم تشفير جميع الوصفات الطبية وبيانات المرضى محلياً (End-to-End) ولا يتم تخزين أي معلومات شخصية بشكل خام (PII) في قواعد البيانات أبداً، مما يضمن توافق النظام مع قوانين حماية الخصوصية.
                </p>
                <div className="flex gap-4 items-center mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                    <i className="fa-solid fa-check text-emerald-500 text-xl"></i>
                    <div>
                        <p className="text-white font-bold text-sm">Supabase حماية</p>
                        <p className="text-xs text-slate-500">يستخدم Row Level Security الصارم.</p>
                    </div>
                </div>
             </div>
             <div className="md:w-1/2 relative">
                 <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                 <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative z-10 shadow-2xl overflow-hidden font-mono text-sm leading-relaxed text-blue-300 opacity-90">
                     <span className="text-slate-500">{'// Encryption Payload Example'}</span><br/>
                     <span className="text-emerald-400">const</span> <span className="text-slate-300">payload</span> = <span className="text-emerald-400">await</span> <span className="text-yellow-200">encryptData</span>({'{'}<br/>
                     &nbsp;&nbsp;<span className="text-slate-300">patientHash</span>: <span className="text-orange-300">'8d969eef6...9012cd'</span>,<br/>
                     &nbsp;&nbsp;<span className="text-slate-300">medications</span>: [<span className="text-orange-300">'Amlodipine 5mg'</span>],<br/>
                     &nbsp;&nbsp;<span className="text-slate-300">signature</span>: <span className="text-orange-300">'dr_x_cert_39912'</span><br/>
                     {'}'});<br/><br/>
                     <span className="text-slate-500">{'// The actual QR code contains only an ID & key, the data requires authorized lookup.'}</span>
                 </div>
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 border-t border-slate-900 text-center">
         <p className="text-slate-600 text-sm">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - مشروع صحة (Seha Platform)</p>
      </footer>
    </div>
  );
}
