'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  patientPhone?: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  isNew?: boolean; // For animation trigger
}

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  cancelBooking: (bookingId: string) => void;
  deleteBooking: (bookingId: string) => void;
  getBookingsByDoctor: (doctorId: string) => Booking[];
  getBookingsByPatient: (patientName: string) => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider Component
export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'booking-1',
      doctorId: 'doc_001',
      doctorName: 'د. يوسف بركات',
      patientName: 'محمد رضا',
      patientPhone: '0612345678',
      time: '09:00',
      status: 'completed',
      notes: 'متابعة',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'booking-2',
      doctorId: 'doc_001',
      doctorName: 'د. يوسف بركات',
      patientName: 'سارة بن علي',
      patientPhone: '0687654321',
      time: '09:30',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isNew: true,
    };
    setBookings((prev) => [...prev, newBooking]);
    
    // Remove isNew flag after animation
    setTimeout(() => {
      setBookings((prev) =>
        prev.map((b) => (b.id === newBooking.id ? { ...b, isNew: false } : b))
      );
    }, 1000);

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
  };

  const deleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const getBookingsByDoctor = (doctorId: string) => {
    return bookings.filter((b) => b.doctorId === doctorId);
  };

  const getBookingsByPatient = (patientName: string) => {
    return bookings.filter((b) => b.patientName === patientName);
  };

  const value: BookingContextType = {
    bookings,
    addBooking,
    updateBookingStatus,
    cancelBooking,
    deleteBooking,
    getBookingsByDoctor,
    getBookingsByPatient,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

// Custom hook to use booking context
export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}
