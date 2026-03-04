'use client';

import { BorderRadius, Colors } from '@/pages/constants';
import styled from '@emotion/styled';
import Particles from './particles';
import React from 'react';
import { useTypedRootNavigation } from '@/app/navigation/RootNavHook';
import {
  Button,
  Checkbox,
  Flex,
  Text,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Image,
  Box,
} from '@chakra-ui/react';
import { useLoginMutation } from '@/infrastructure/auth/auth.redux.api';
import { useDispatch } from 'react-redux';
import {
  loginFailure,
  loginSuccess,
} from '@/infrastructure/auth/auth.redux.slice';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';

export default function LoginScreen() {
  const route = useTypedRootNavigation();
  const dispatch = useDispatch();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [
    login,
    { isLoading: isLoginLoading, error, data, isError: isLoginError },
  ] = useLoginMutation();

  const handleLogin = async () => {
    if (!username || !password) {
      console.log({ username, password });
      alert('Please fill in both fields');
      return;
    }

    try {
      const result = await login({ username, password }).unwrap();
      dispatch(
        loginSuccess({ token: result.access_token, userData: result.user }),
      );
      route('/admin');
    } catch (err) {
      dispatch(loginFailure(err.message ?? 'Something went wrong'));
    }
  };

  return (
    <Container>
      <Stack minH={'100vh'} direction={{ base: 'column', md: 'row' }}>
        <Flex p={8} flex={1} align={'center'} justify={'center'}>
          <Stack spacing={4} w={'full'} maxW={'md'}>
            <Heading fontSize={'2xl'}>Sign in to your account</Heading>
            <FormControl id="email">
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Stack spacing={6}>
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                align={'start'}
                justify={'space-between'}
              >
                <Checkbox>Remember me</Checkbox>
                <Text color={'blue.500'}>Forgot password?</Text>
              </Stack>
              <Button
                colorScheme={'blue'}
                variant={'solid'}
                onClick={handleLogin}
              >
                Sign in
              </Button>
              <button onClick={handleLogin}> Sign In</button>
              <Button
                colorScheme={'blue'}
                variant={'solid'}
                onClick={() => route('/')}
              >
                Back To Home
              </Button>
            </Stack>
          </Stack>
        </Flex>
        <Flex flex={1}>
          <Image
            alt={'Login Image'}
            objectFit={'cover'}
            src={
              'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80'
            }
          />
        </Flex>
      </Stack>

      <Particles
        particleColors={['#ffffff', '#ffffff']}
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
      <AsyncState
        isLoading={isLoginLoading}
        isError={isLoginError}
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
        <div></div>
      </AsyncState>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100dvh;
  min-width: 100dvw;
  height: 100dvh;
  width: 100dvw;
  position: 'relative';

  color: ${Colors.TextInverse[2]};
  background-color: black;

  > :nth-of-type(2) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  > :nth-of-type(1) {
    /* aspect-ratio: 1; */
    /* height: 400px; */
    position: absolute;
    top: 50%;
    width: 100%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: ${BorderRadius.md};
    z-index: 5;

    padding: 1rem;

    /* background-color: ${Colors.PrimaryLight[8]}; */
    background-color: transparent;
    /* background-color: green; */
  }
`;
