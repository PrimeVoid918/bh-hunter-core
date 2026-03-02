'use client';

import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  HStack,
  Flex,
  FormErrorMessage,
  Box,
  useColorMode,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import DialogWrapper, {
  DialogWrapperProps,
} from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import styled from '@emotion/styled';
import { Colors } from '@/pages/constants';
import { useCreateOwnerMutation } from '@/infrastructure/admin/admin.redux.api';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/stores';

interface CreateOwnerComponentFormProps {
  dialogConfig: DialogWrapperProps;
  onSuccess?: () => void;
}

type FormData = {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string; // ✅ added
  age: number;
  guardian: string;
  address: string;
  phone_number: string;
};

export default function CreateOwnerComponentForm({
  dialogConfig,
  onSuccess,
}: CreateOwnerComponentFormProps) {
  const { colorMode } = useColorMode();
  const user = useSelector((state: RootState) => state.auth.user);
  const adminId = user?.id;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const [
    createOwner,
    {
      isLoading: isCreateLoading,
      isError: isCreateError,
      error: createErrorObj,
    },
  ] = useCreateOwnerMutation();

  const onSubmit = (data: FormData) => {
    if (!data && !adminId) return;

    createOwner({
      id: adminId,
      data: {
        ...data,
        age: Number(data.age),
      },
    })
      .unwrap()
      .then((res) => {
        dialogConfig.onClose?.(); // Close the add-user modal
        onSuccess?.();
      })
      .catch((err) => {
        console.log('Error', err);
        // You can trigger your error modal here explicitly
      });
  };

  // ✅ get current password value for confirm validation
  const passwordValue = watch('password');

  return (
    <DialogWrapper {...dialogConfig}>
      <AsyncState
        isLoading={isCreateLoading}
        isError={isCreateError}
        globalOverlay
        errorObject={createErrorObj}
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
        <p></p>
      </AsyncState>

      <FormContainer onSubmit={handleSubmit(onSubmit)} colorMode={colorMode}>
        {/* Scrollable section for inputs */}
        <Flex
          direction="column"
          gap={4}
          flex="1"
          minH="0"
          overflowY="auto"
          pr={2}
        >
          <HStack spacing={4}>
            <FormControl
              id="firstname"
              isRequired
              isInvalid={!!errors.firstname}
            >
              <FormLabel>First Name</FormLabel>
              <Input
                type="text"
                {...register('firstname', {
                  required: 'First name is required',
                })}
              />
              <FormErrorMessage>{errors.firstname?.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="lastname" isInvalid={!!errors.lastname}>
              <FormLabel>Last Name</FormLabel>
              <Input type="text" {...register('lastname')} />
              <FormErrorMessage>{errors.lastname?.message}</FormErrorMessage>
            </FormControl>
          </HStack>

          <FormControl id="email" isRequired isInvalid={!!errors.email}>
            <FormLabel>Email address</FormLabel>
            <Input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="guardian" isRequired isInvalid={!!errors.guardian}>
            <FormLabel>Guardian</FormLabel>
            <Input
              type="text"
              {...register('guardian', { required: 'Guardian is required' })}
            />
            <FormErrorMessage>{errors.guardian?.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="address" isRequired isInvalid={!!errors.address}>
            <FormLabel>Address</FormLabel>
            <Input
              type="text"
              {...register('address', { required: 'Address is required' })}
            />
            <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            id="phone_number"
            isRequired
            isInvalid={!!errors.phone_number}
          >
            <FormLabel>Phone Number</FormLabel>
            <Input
              type="text"
              {...register('phone_number', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]+$/,
                  message: 'Invalid phone number',
                },
              })}
            />
            <FormErrorMessage>{errors.phone_number?.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="age" isRequired isInvalid={!!errors.age}>
            <FormLabel>Age</FormLabel>
            <Input
              type="number"
              {...register('age', {
                required: 'Age is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Age must be positive' },
              })}
            />
            <FormErrorMessage>{errors.age?.message}</FormErrorMessage>
          </FormControl>

          <hr></hr>

          <FormControl id="username" isRequired isInvalid={!!errors.username}>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              {...register('username', { required: 'Username is required' })}
            />
            <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="password" isRequired isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              <InputRightElement h="full">
                <Button
                  variant="ghost"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          {/* ✅ Confirm Password */}
          <FormControl
            id="confirmPassword"
            isRequired
            isInvalid={!!errors.confirmPassword}
          >
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === passwordValue || 'Passwords do not match',
                })}
              />
              <InputRightElement h="full">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>
              {errors.confirmPassword?.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>

        {/* Fixed button at bottom */}
        <Box mt={4} className="action-buttons">
          <Button
            size="lg"
            w="100%"
            bg="blue.400"
            color="white"
            _hover={{ bg: 'blue.500' }}
            onClick={() => dialogConfig.onClose?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            w="100%"
            bg="blue.400"
            color="white"
            _hover={{ bg: 'blue.500' }}
          >
            Submit
          </Button>
        </Box>
      </FormContainer>
    </DialogWrapper>
  );
}

const FormContainer = styled.form<{ colorMode: string }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;

  scrollbar-width: thin;

  > :nth-of-type(1) {
    > hr {
      padding: 1rem 0 0 0;
      border-top-width: 3px;
      border-top-color: ${({ colorMode }) =>
        colorMode === 'light'
          ? Colors.PrimaryLight[7]
          : Colors.PrimaryLight[5]};
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 1rem;

    > * {
      width: auto;
      padding: 0.2rem 1rem;
    }

    > :nth-of-type(1) {
      background-color: ${({ colorMode }) =>
        colorMode === 'light'
          ? Colors.PrimaryLight[6]
          : Colors.PrimaryLight[6]};

      :hover {
        background-color: ${({ colorMode }) =>
          colorMode === 'dark'
            ? Colors.PrimaryLight[3]
            : Colors.PrimaryLight[6]};
        color: ${({ colorMode }) =>
          colorMode === 'light'
            ? Colors.PrimaryLight[2]
            : Colors.PrimaryLight[5]};
      }
    }

    > :nth-of-type(2) {
      background-color: ${({ colorMode }) =>
        colorMode === 'light'
          ? Colors.PrimaryLight[2]
          : Colors.PrimaryLight[5]};
      color: ${({ colorMode }) =>
        colorMode === 'dark' ? Colors.PrimaryLight[2] : Colors.PrimaryLight[5]};

      :hover {
        background-color: ${({ colorMode }) =>
          colorMode === 'dark'
            ? Colors.PrimaryLight[4]
            : Colors.PrimaryLight[6]};

        color: ${({ colorMode }) =>
          colorMode === 'light'
            ? Colors.PrimaryLight[4]
            : Colors.PrimaryLight[6]};
      }
    }
  }
`;
