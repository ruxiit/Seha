export type ProviderType = 'pharmacy' | 'doctor';

export interface ProviderPoint {
  id: string;
  name: string;
  type: ProviderType;
  specialty?: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  openFrom: string;
  openTo: string;
  rating: number;
}

export const providerDirectory: ProviderPoint[] = [
  {
    id: 'ph-101',
    name: 'Seha Care Pharmacy',
    type: 'pharmacy',
    lat: 36.7525,
    lng: 3.0418,
    address: 'Didouche Mourad, Algiers',
    phone: '+213 21 11 22 33',
    openFrom: '08:00',
    openTo: '22:00',
    rating: 4.8,
  },
  {
    id: 'ph-102',
    name: 'Central Health Pharmacy',
    type: 'pharmacy',
    lat: 36.7662,
    lng: 3.0517,
    address: 'Belouizdad, Algiers',
    phone: '+213 21 33 44 55',
    openFrom: '09:00',
    openTo: '21:00',
    rating: 4.5,
  },
  {
    id: 'ph-103',
    name: 'Green Cross Pharmacy',
    type: 'pharmacy',
    lat: 36.7418,
    lng: 3.0324,
    address: 'Sidi Mhamed, Algiers',
    phone: '+213 21 55 66 77',
    openFrom: '07:30',
    openTo: '23:00',
    rating: 4.7,
  },
  {
    id: 'dr-201',
    name: 'Dr. Nadia Benali',
    type: 'doctor',
    specialty: 'Cardiology',
    lat: 36.7589,
    lng: 3.0674,
    address: 'Mustapha Pacha Clinic, Algiers',
    phone: '+213 21 80 70 60',
    openFrom: '09:00',
    openTo: '18:00',
    rating: 4.9,
  },
  {
    id: 'dr-202',
    name: 'Dr. Karim Bensaid',
    type: 'doctor',
    specialty: 'Internal Medicine',
    lat: 36.7349,
    lng: 3.0199,
    address: 'Bir Mourad Rais, Algiers',
    phone: '+213 21 40 30 20',
    openFrom: '10:00',
    openTo: '19:00',
    rating: 4.6,
  },
  {
    id: 'dr-203',
    name: 'Dr. Leila Haddad',
    type: 'doctor',
    specialty: 'Pediatrics',
    lat: 36.7708,
    lng: 3.0722,
    address: 'Kouba Medical Center, Algiers',
    phone: '+213 21 70 60 50',
    openFrom: '08:30',
    openTo: '17:30',
    rating: 4.7,
  },
];

const timeToMinutes = (time: string): number => {
  const [hour, minute] = time.split(':').map((part) => Number(part));
  return (hour * 60) + minute;
};

export const isProviderOpenNow = (provider: ProviderPoint, now: Date = new Date()): boolean => {
  const current = (now.getHours() * 60) + now.getMinutes();
  const starts = timeToMinutes(provider.openFrom);
  const ends = timeToMinutes(provider.openTo);
  return current >= starts && current < ends;
};
