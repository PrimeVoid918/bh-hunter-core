import React from 'react';
import styled from '@emotion/styled';
import { Colors } from '@/pages/constants';
import { useColorMode } from '@chakra-ui/react';

export default function BaseWrapper({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { colorMode } = useColorMode();

  return (
    <Wrapper colorMode={colorMode} style={style} className={className}>
      {children}
    </Wrapper>
  );
}

const Wrapper = styled.section<{ colorMode: string }>`
  display: flex;
  flex-direction: column;
  min-height: calc(88dvh - 5rem);

  background-color: transparent;

  /* Default scroll behavior for children if needed */
  > :nth-of-type(1) {
    /* --bg-color: ${({ colorMode }) =>
      colorMode === 'light' ? Colors.PrimaryLight[3] : Colors.PrimaryLight[8]};
    background-color: var(--bg-color); */
  }

  & > * {
    flex: 1; /* make direct children fill available space */
    overflow-y: auto; /* scroll if content exceeds height */
  }
`;
