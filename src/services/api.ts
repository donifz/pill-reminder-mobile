import axios from 'axios';
import { getApiUrl } from '../config';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Medication {
  id: string;
  name: string;
  dose: string;
  times: string[];
  taken: boolean;
  startDate: string;
  endDate: string;
  duration: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  imageUrl?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  openNow?: boolean;
  photos?: Array<{
    reference: string;
    height: number;
    width: number;
  }>;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  price?: number;
  inStock?: boolean;
  isAvailable?: boolean;
}

export const medicationService = {
  getAll: async (): Promise<Medication[]> => {
    const response = await api.get('/medications');
    return response.data;
  },

  create: async (data: Omit<Medication, 'id' | 'taken'>): Promise<Medication> => {
    const response = await api.post('/medications', data);
    return response.data;
  },

  take: async (id: string): Promise<Medication> => {
    const response = await api.post(`/medications/${id}/take`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/medications/${id}`);
  },
};

export const pharmacyService = {
  getNearby: async (latitude: number, longitude: number, radius?: number): Promise<Pharmacy[]> => {
    try {
      const response = await api.get('/pharmacies/nearby', { 
        params: { latitude, longitude, radius } 
      });
      return response.data.map((pharmacy: any) => ({
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        distance: '', // Will be calculated on the frontend
        location: pharmacy.location,
        rating: pharmacy.rating,
        openNow: pharmacy.openNow
      }));
    } catch (error) {
      console.log('Error fetching pharmacies, using mock data instead:', error);
      // Return mock data if the API call fails
      return getMockPharmacies(latitude, longitude);
    }
  },
  
  getMedicines: async (pharmacyId: string): Promise<Medicine[]> => {
    try {
      const response = await api.get(`/pharmacies/${pharmacyId}/medicines`);
      return response.data;
    } catch (error) {
      console.log('Error fetching medicines, using mock data instead:', error);
      // Return mock medicines if the API call fails
      return getMockMedicines();
    }
  }
};

// Mock pharmacy data for when API fails
const getMockPharmacies = (latitude: number, longitude: number): Pharmacy[] => {
  console.log('Using mock pharmacy data');
  return [
    {
      id: 'mock-pharmacy-1',
      name: 'City Pharmacy',
      address: '123 Main St',
      distance: '0.5 miles',
      location: {
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
      },
      rating: 4.5,
      openNow: true,
    },
    {
      id: 'mock-pharmacy-2',
      name: 'Health Plus Pharmacy',
      address: '456 Oak Avenue',
      distance: '0.8 miles',
      location: {
        latitude: latitude - 0.002,
        longitude: longitude + 0.002,
      },
      rating: 4.2,
      openNow: true,
    },
    {
      id: 'mock-pharmacy-3',
      name: 'MediCare Pharmacy',
      address: '789 Pine Street',
      distance: '1.2 miles',
      location: {
        latitude: latitude + 0.003,
        longitude: longitude - 0.001,
      },
      rating: 3.9,
      openNow: false,
    },
    {
      id: 'mock-pharmacy-4',
      name: '24-Hour Drug Store',
      address: '321 Elm Boulevard',
      distance: '1.5 miles',
      location: {
        latitude: latitude - 0.001,
        longitude: longitude - 0.003,
      },
      rating: 4.7,
      openNow: true,
    },
    {
      id: 'mock-pharmacy-5',
      name: 'Community Pharmacy',
      address: '555 Cedar Lane',
      distance: '2.0 miles',
      location: {
        latitude: latitude + 0.002,
        longitude: longitude + 0.003,
      },
      rating: 4.0,
      openNow: true,
    },
  ];
};

// Mock medicine data for when API fails
const getMockMedicines = (): Medicine[] => {
  console.log('Using mock medicine data');
  return [
    {
      id: 'mock-med-1',
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      description: 'Pain reliever and fever reducer',
      price: 5.99,
      inStock: true,
    },
    {
      id: 'mock-med-2',
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      description: 'Anti-inflammatory pain reliever',
      price: 6.99,
      inStock: true,
    },
    {
      id: 'mock-med-3',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      description: 'Antibiotic medication',
      price: 12.50,
      inStock: true,
    },
    {
      id: 'mock-med-4',
      name: 'Loratadine',
      genericName: 'Loratadine',
      description: 'Antihistamine for allergies',
      price: 8.99,
      inStock: false,
    },
    {
      id: 'mock-med-5',
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      description: 'Reduces stomach acid production',
      price: 15.75,
      inStock: true,
    },
  ];
};

export const doctorService = {
  search: async (query: { name?: string, specialization?: string }): Promise<Doctor[]> => {
    const response = await api.get('/doctors/search', { params: query });
    return response.data;
  },
  
  getUpcomingAppointment: async (): Promise<{ doctor: Doctor, date: string, time: string } | null> => {
    try {
      const response = await api.get('/appointments/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointment:', error);
      return null;
    }
  }
};

export const medicineService = {
  search: async (query: { name?: string, genericName?: string }): Promise<Medicine[]> => {
    const response = await api.get('/medicines/search', { params: query });
    return response.data;
  }
}; 