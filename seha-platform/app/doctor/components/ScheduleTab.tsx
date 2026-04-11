'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, CheckCircle, AlertCircle, User, Phone, X, Save, Trash2, Copy, Sparkles } from 'lucide-react';
import { useBookings, type Booking } from '@/lib/bookingStore';

interface Slot {
  id: string;
  bookingId?: string;
  time: string;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  patientName?: string;
  patientPhone?: string;
  notes?: string;
  isNew?: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DOCTOR_ID = 'doc_001';

export default function ScheduleTab() {
  const { bookings, updateBookingStatus, cancelBooking } = useBookings();
  
  const [localSlots, setLocalSlots] = useState<Slot[]>([
    { id: '3', time: '10:00', status: 'available' },
    { id: '4', time: '10:30', status: 'available' },
    { id: '6', time: '11:30', status: 'available' },
    { id: '7', time: '14:00', status: 'available' },
    { id: '10', time: '15:30', status: 'available' },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState<{
    patientName: string;
    patientPhone: string;
    notes: string;
    status: 'available' | 'booked' | 'completed' | 'cancelled';
  }>({
    patientName: '',
    patientPhone: '',
    notes: '',
    status: 'available',
  });
  const [newSlotTime, setNewSlotTime] = useState('12:00');

  // Merge bookings with local slots
  const getDoctorBookings = () => {
    return bookings.filter(b => b.doctorId === DOCTOR_ID);
  };

  const mergedSlots = React.useMemo(() => {
    const bookingSlots = getDoctorBookings().map((booking) => {
      let slotStatus: 'available' | 'booked' | 'completed' | 'cancelled' = 'booked';
      if (booking.status === 'completed') {
        slotStatus = 'completed';
      } else if (booking.status === 'cancelled') {
        slotStatus = 'cancelled';
      } else {
        slotStatus = 'booked'; // pending and confirmed both map to booked
      }
      
      return {
        id: booking.id,
        bookingId: booking.id,
        time: booking.time,
        status: slotStatus,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        notes: booking.notes,
        isNew: booking.isNew,
      };
    });

    const allSlots = [...bookingSlots, ...localSlots.filter(s => !bookingSlots.some(b => b.time === s.time))];
    return allSlots.sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, localSlots]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Trigger toast for new bookings
  useEffect(() => {
    const newBookings = mergedSlots.filter(s => s.isNew);
    newBookings.forEach(booking => {
      if (booking.bookingId) {
        showToast(`📱 تم حجز موعد جديد - ${booking.time}`, 'info');
      }
    });
  }, [bookings]);

  // Toast notification system
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Open edit modal
  const handleEditClick = (slot: Slot) => {
    setEditingSlot(slot);
    setFormData({
      patientName: slot.patientName || '',
      patientPhone: slot.patientPhone || '',
      notes: slot.notes || '',
      status: slot.status,
    });
    setIsEditModalOpen(true);
  };

  // Save appointment
  const handleSaveAppointment = () => {
    if (!editingSlot) return;
    
    if (editingSlot.bookingId) {
      // Update booking via store
      updateBookingStatus(editingSlot.bookingId, formData.status === 'available' ? 'confirmed' : (formData.status === 'booked' ? 'confirmed' : formData.status));
      showToast('تم تحديث الموعد بنجاح', 'success');
    } else {
      // Update local slot
      setLocalSlots(prev =>
        prev.map(s =>
          s.id === editingSlot.id
            ? { ...s, patientName: formData.patientName || undefined, patientPhone: formData.patientPhone || undefined, notes: formData.notes || undefined, status: formData.status }
            : s
        )
      );
      showToast('تم تحديث الموعد بنجاح', 'success');
    }
    setIsEditModalOpen(false);
    setEditingSlot(null);
  };

  // Quick actions
  const handleQuickAction = (slotId: string, action: 'confirm' | 'cancel' | 'complete') => {
    const slot = mergedSlots.find(s => s.id === slotId);
    if (!slot?.bookingId) return;

    if (action === 'confirm') {
      updateBookingStatus(slot.bookingId, 'confirmed');
      showToast('تم تأكيد الموعد', 'success');
    } else if (action === 'cancel') {
      cancelBooking(slot.bookingId);
      showToast('تم إلغاء الموعد', 'success');
    } else if (action === 'complete') {
      updateBookingStatus(slot.bookingId, 'completed');
      showToast('تم تحديد الموعد كمكتمل', 'success');
    }
  };

  // Delete slot
  const handleDeleteSlot = (slotId: string) => {
    const slot = mergedSlots.find(s => s.id === slotId);
    if (slot?.bookingId) {
      cancelBooking(slot.bookingId);
      showToast('تم حذف الموعد', 'success');
    } else {
      setLocalSlots(prev => prev.filter(s => s.id !== slotId));
      showToast('تم حذف الموعد', 'success');
    }
    setIsEditModalOpen(false);
    setEditingSlot(null);
  };

  // Add new slot
  const handleAddSlot = () => {
    const newSlot: Slot = { id: Date.now().toString(), time: newSlotTime, status: 'available' };
    if (mergedSlots.some(s => s.time === newSlotTime)) {
      showToast('هذا الوقت مشغول بالفعل', 'error');
      return;
    }
    setLocalSlots(prev => [...prev, newSlot].sort((a, b) => a.time.localeCompare(b.time)));
    showToast('تم إضافة موعد جديد', 'success');
    setIsAddModalOpen(false);
    setNewSlotTime('12:00');
  };

  // Duplicate slot
  const handleDuplicateSlot = (slot: Slot) => {
    const [hour, minute] = slot.time.split(':');
    const nextHour = (parseInt(hour) + 1).toString().padStart(2, '0');
    const newTime = `${nextHour}:${minute}`;
    if (mergedSlots.some(s => s.time === newTime)) {
      showToast('الوقت التالي مشغول بالفعل', 'error');
      return;
    }
    const newSlot: Slot = { ...slot, id: Date.now().toString(), time: newTime, status: 'available', patientName: undefined, patientPhone: undefined, notes: undefined };
    setLocalSlots(prev => [...prev, newSlot].sort((a, b) => a.time.localeCompare(b.time)));
    showToast('تم نسخ الموعد', 'success');
  };

  // Calculate statistics
  const stats = {
    total: mergedSlots.length,
    booked: mergedSlots.filter(s => s.status === 'booked').length,
    available: mergedSlots.filter(s => s.status === 'available').length,
    completed: mergedSlots.filter(s => s.status === 'completed').length,
  };

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Status config
  const statusConfig = {
    available: {
      color: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
      icon: '✓',
      label: 'متاح',
    },
    booked: {
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
      icon: '📅',
      label: 'محجوز',
    },
    completed: {
      color: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-600',
      icon: '✓✓',
      label: 'اكتمل',
    },
    cancelled: {
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-600',
      badge: 'bg-red-100 text-red-600',
      icon: '✕',
      label: 'ملغى',
    },
  };

  return (
    <div className="animate-in fade-in space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6">
        {/* Title & Date */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">إدارة المواعيد</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={18} />
            <span className="text-sm">{today}</span>
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المواعيد', value: stats.total, icon: '📋', color: 'blue' },
            { label: 'محجوز', value: stats.booked, icon: '✓', color: 'blue' },
            { label: 'متاح', value: stats.available, icon: '◯', color: 'emerald' },
            { label: 'مكتمل', value: stats.completed, icon: '✓✓', color: 'slate' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold text-${stat.color}-600 mb-1`}>{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                </div>
                <span className="text-3xl opacity-50">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-blue-600/30 text-sm"
          >
            <Plus size={18} />
            إضافة موعد
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition-all text-sm ${
              editMode
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Edit2 size={18} />
            {editMode ? 'تم (Esc)' : 'وضع التعديل'}
          </button>
        </div>
      </div>

      {/* TIMELINE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          <Clock size={22} className="text-blue-600" />
          الجدول الزمني للمواعيد
        </h2>

        {mergedSlots.length === 0 ? (
          // EMPTY STATE
          <div className="py-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">لا توجد مواعيد اليوم</h3>
            <p className="text-slate-500 mb-6">استرخ! يومك خالٍ من المواعيد.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              إضافة موعد جديد
            </button>
          </div>
        ) : (
          // TIMELINE
          <div className="space-y-4">
            {mergedSlots.map((slot, index) => {
              const config = statusConfig[slot.status];
              const isCurrentTime = slot.time === currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

              return (
                <div
                  key={slot.id}
                  className="relative"
                  onMouseEnter={() => setHoveredSlot(slot.id)}
                  onMouseLeave={() => setHoveredSlot(null)}
                >
                  {/* Current time indicator */}
                  {isCurrentTime && (
                    <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full pulse shadow-lg shadow-red-500/50" />
                  )}

                  {/* Appointment Card */}
                  <div
                    onClick={() => handleEditClick(slot)}
                    className={`${config.color} border-l-4 cursor-pointer ${
                      slot.status === 'available'
                        ? 'border-l-emerald-400'
                        : slot.status === 'booked'
                        ? 'border-l-blue-400'
                        : slot.status === 'completed'
                        ? 'border-l-slate-300'
                        : 'border-l-red-400'
                    } rounded-xl p-4 transition-all ${
                      hoveredSlot === slot.id ? 'shadow-md transform scale-[1.02]' : 'shadow-sm'
                    } ${
                      slot.isNew ? 'animate-pulse shadow-lg shadow-amber-300/50 bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: Time & Status */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="text-2xl font-bold text-slate-900">{slot.time}</span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                            {config.label}
                          </span>
                          {slot.isNew && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 animate-pulse flex items-center gap-1">
                              <Sparkles size={14} />
                              جديد
                            </span>
                          )}
                          {isCurrentTime && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                              جاري الآن
                            </span>
                          )}
                        </div>

                        {/* Patient info */}
                        {slot.patientName && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-700">
                              <User size={16} className="text-slate-400" />
                              <span className="font-semibold">{slot.patientName}</span>
                            </div>
                            {slot.patientPhone && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span className="text-sm">{slot.patientPhone}</span>
                              </div>
                            )}
                            {slot.notes && (
                              <p className="text-sm text-slate-600 italic">💬 {slot.notes}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      {hoveredSlot === slot.id && (
                        <div className="flex gap-2 mr-4 flex-wrap justify-end">
                          {slot.status === 'available' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(slot.id, 'confirm');
                              }}
                              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                              title="تأكيد"
                            >
                              <CheckCircle size={16} className="text-emerald-600" />
                            </button>
                          )}
                          {slot.status === 'booked' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(slot.id, 'complete');
                                }}
                                className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                title="تحديد كمكتمل"
                              >
                                <CheckCircle size={16} className="text-emerald-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(slot.id, 'cancel');
                                }}
                                className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                title="إلغاء"
                              >
                                <X size={16} className="text-red-600" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateSlot(slot);
                            }}
                            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                            title="نسخ الموعد"
                          >
                            <Copy size={16} className={config.textColor} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(slot);
                            }}
                            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                            title="تحرير"
                          >
                            <Edit2 size={16} className={config.textColor} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STATUS LEGEND */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-3">وسيلة الإيضاح</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${config.badge}`} />
              <span className="text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />

      {/* EDIT APPOINTMENT MODAL */}
      {isEditModalOpen && editingSlot && (
        <Modal
          title="تحرير الموعد"
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSlot(null);
          }}
        >
          <div className="space-y-5">
            {/* Time Display */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-2">الوقت</label>
              <div className="text-2xl font-bold text-slate-900">{editingSlot.time}</div>
            </div>

            {/* Patient Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">اسم المريض</label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="أدخل اسم المريض"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Patient Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.patientPhone}
                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أدخل ملاحظات إضافية"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">متاح</option>
                <option value="booked">محجوز</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغى</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveAppointment}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all"
              >
                <Save size={18} />
                حفظ التغييرات
              </button>
              <button
                onClick={() => handleDeleteSlot(editingSlot.id)}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all"
              >
                <Trash2 size={18} />
                حذف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD APPOINTMENT MODAL */}
      {isAddModalOpen && (
        <Modal
          title="إضافة موعد جديد"
          onClose={() => setIsAddModalOpen(false)}
        >
          <div className="space-y-5">
            {/* Time Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">الوقت</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddSlot}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  <Plus size={18} />
                  إضافة
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">سيتم إضافة الموعد كموعد متاح جديد</p>
          </div>
        </Modal>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-semibold text-sm animate-in fade-in slide-in-from-bottom-4 ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            <span>
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Reusable Modal Component
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </>
  );
}
