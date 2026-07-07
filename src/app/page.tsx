import React from 'react';
import { getDb } from '@/lib/db';
import PortfolioClient from '@/components/portfolio/PortfolioClient';

// Enable dynamic rendering so it pulls new data from db.json instantly
export const revalidate = 0;

export default async function HomePage() {
  const db = await getDb();
  
  return (
    <PortfolioClient initialDb={db} />
  );
}
