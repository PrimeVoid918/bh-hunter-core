import { Outlet } from 'react-router-dom';
import Footer from '@/pages/shared/layouts/ui/footer';
import LandingNavBar from './landing.nav-bar';
import styled from '@emotion/styled';

export default function LandingLayout() {
  return (
    <Container>
      <LandingNavBar />
      <Outlet />
      <Footer />
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
`;
