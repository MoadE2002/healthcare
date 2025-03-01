'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import axiosInstance from '../../../../apicalls/axiosInstance';
import PrescriptionView from '@/components/PrescriptionView';

export default function PrescriptionDetailPage() {
  const params = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const response = await axiosInstance.get(`/prescription/${params.id}`);
        setPrescription(response.data.prescription);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPrescription();
    }
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading prescription</div>;

  return <PrescriptionView prescription={prescription} />;
}