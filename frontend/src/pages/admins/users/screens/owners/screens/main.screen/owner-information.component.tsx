import { Colors } from '@/pages/constants';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { useGetOneQuery } from '@/infrastructure/owner/owner.redux.api';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import {
  Badge,
  Box,
  Divider,
  Flex,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React from 'react';

export default function OwnerInformationComponent({ id }: { id: number }) {
  const { colorMode } = useColorMode();

  const { data: userData, error, isError, isLoading } = useGetOneQuery(id);
  return (
    <AsyncState
      isError={isError}
      isLoading={isLoading}
      globalOverlay={false}
      errorObject={error}
      errorBody={(err) => {
        // Narrow types if possible
        if ('status' in err) {
          if (err.status >= '500') {
            return (
              <Box>
                🚨 Server error (500): something went wrong on our side.
              </Box>
            );
          }

          if (err.status >= '400') {
            return (
              <Box>
                ⚠️ Client error ({err.status}): maybe bad request or
                unauthorized.
                {/* <pre>{JSON.stringify(err.data, null, 2)}</pre> */}
              </Box>
            );
          }
        }

        // Fallback for unknown error shapes
        return (
          <Box color="gray.500">
            ❓ Unexpected error
            <pre>{JSON.stringify(err, null, 2)}</pre>
          </Box>
        );
      }}
    >
      {userData && (
        <Container borderRadius="md" w="100%" colorMode={colorMode}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="bold" fontSize="lg">
              {userData.firstname} {userData.lastname}
            </Text>
            <Badge colorScheme={userData.isVerified ? 'green' : 'orange'}>
              {userData.isVerified ? 'Verified' : 'Not Verified'}
            </Badge>
          </Flex>

          <Divider mb={3} />

          <Flex direction="column" gap={2}>
            <Flex justify="space-between">
              <Text fontWeight="medium">Username:</Text>
              <Text>{userData.username}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontWeight="medium">Email:</Text>
              <Text>{userData.email}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontWeight="medium">Phone:</Text>
              <Text>{userData.phone_number || '-'}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontWeight="medium">Age:</Text>
              <Text>{userData.age || '-'}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontWeight="medium">Active:</Text>
              <Text>{userData.isActive ? 'Yes' : 'No'}</Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontWeight="medium">Account Created:</Text>
              {/* <Text>{new Date(userData.createdAt).toLocaleString()}</Text> */}
              <Text>{parseIsoDate(userData.createdAt)?.dateOnly}</Text>
            </Flex>
          </Flex>
        </Container>
      )}
    </AsyncState>
  );
}

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'colorMode',
})<{ colorMode: string }>`
  padding: 1rem;
  background-color: ${({ colorMode }) =>
    colorMode === 'dark' ? Colors.PrimaryLight[9] : Colors.PrimaryLight[3]};
`;
