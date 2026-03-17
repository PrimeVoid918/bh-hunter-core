import React from 'react';
import styled from '@emotion/styled';
import { Outlet } from 'react-router-dom';

export default function AccountsLayout() {
  return (
    <Container>
      <Outlet />
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
`;
