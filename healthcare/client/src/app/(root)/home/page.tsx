"use client"
import React from 'react';
import InfoHome from '../../../components/InfoHome/InfoHome';
import HeroSection from '../../../components/HeroSection';
import FeatureSection from '../../../components/FeatureSection'; 
import Workflow from '../../../components/Workflow';
import Pricing from '../../../components/Pricing';
import Testimonials from '../../../components/Testimonials'
import Hero from '../../../components/Hero/Hero'

const Home = () => {
  return (
    
      <div className="max-w-7xl mx-auto pt-20 px-6">
        <Hero />
        <FeatureSection />
        <Workflow />
        <Testimonials width={3} bg={false} />
      </div>
    
  );
};

export default Home;
