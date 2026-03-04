import styled from '@emotion/styled';
import React from 'react';
import { Outlet } from 'react-router-dom';

export default function PricingLayout() {
  return (
    <Container>
      <Outlet />
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
`;
