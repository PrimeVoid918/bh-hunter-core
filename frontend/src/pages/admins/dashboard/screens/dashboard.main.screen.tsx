import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Colors } from '@/pages/constants';
import BaseWrapper from '@/pages/shared/layouts/wrappers/base-wrapper';

// Motion-enhanced Box
// const MotionBox = motion(Box);

export default function DashboardMainScreen() {
  return (
    <BaseWrapper>
      <Container
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <VStack>
          <Text fontSize="2xl" fontWeight="bold">
            Welcome to Dashboard
          </Text>
          <Box
            p={4}
            bg={Colors.PrimaryLight[7]}
            borderRadius="md"
            w="100%"
          ></Box>
        </VStack>
      </Container>
    </BaseWrapper>
  );
}

const Container = styled.div`
  border: 1px solid green;
  width: 100%;
  height: 100%;

  flex: 1;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  > :nth-of-type(1) {
    border: 1px solid red;
  }
`;
