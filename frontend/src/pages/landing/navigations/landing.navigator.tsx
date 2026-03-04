import React from 'react';
import LandingLayout from './landing.layout';
import LandingPage from '../landing/landing-page';
import DownloadsPage from '../downloads/downloads.page';
import AboutPage from '../about/about.page';
import LegalPage from '../legal/legal';
import PricingNavigator from '../pricing/navigation/pricing.navigator';

export default function LandingNavigator() {
  return {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'download', element: <DownloadsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'legal', element: <LegalPage /> },
      { ...PricingNavigator() },
    ],
  };
}
