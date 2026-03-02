'use client';
import React, { useState } from 'react';
import {
  AspectRatio,
  Heading,
  Image,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  logout,
  selectAuthStatus,
  selectAuthError,
} from '@/infrastructure/auth/auth.redux.slice';

import {
  IconButton,
  Button,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Text,
  BoxProps,
  FlexProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { IconType } from 'react-icons';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@chakra-ui/react';
import { Collapse } from '@chakra-ui/react';
import DialogWrapper from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
// import logoService from '@/assets/logo/logo.service';
import { Svg11 } from '@/assets/logo/1_1';

export interface LinkItemProps {
  name: string;
  icon?: IconType;
  link?: string;
  children?: Array<LinkItemProps>;
  colorModes?: {
    light: string;
    dark: string;
  };
}

interface NavItemProps extends FlexProps {
  icon?: IconType;
  colorModes?: {
    light: string;
    dark: string;
  };
  children: React.ReactNode;
}

interface MobileProps extends FlexProps {
  onOpen: () => void;
  colorModes: {
    light: string;
    dark: string;
  };
  data: {
    name: string;
    logo: string;
    pfp: string;
    role: string;
    optionsArray?: Array<{ name: string; link: string }>;
  };
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
  colorModes: {
    light: string;
    dark: string;
  };
  linkItems: Array<LinkItemProps>;
}

const SidebarLinkItem = ({ link }: { link: LinkItemProps }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = !!link.children?.length;

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <Box w="full">
      <Box display="flex" alignItems="center">
        <NavItem
          icon={link.icon}
          onClick={hasChildren ? toggle : undefined} // toggle only if has children
          cursor={hasChildren ? 'pointer' : undefined}
          colorModes={link?.colorModes}
        >
          {link.link ? (
            <Link
              as={RouterLink}
              to={link.link}
              style={{ textDecoration: 'none', flex: 1 }}
            >
              {link.name}
            </Link>
          ) : (
            <Box flex={1}>{link.name}</Box>
          )}
        </NavItem>

        {hasChildren && (
          <IconButton
            aria-label="Toggle dropdown"
            icon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
            size="sm"
            onClick={toggle}
            variant="ghost"
          />
        )}
      </Box>

      {hasChildren && (
        <Collapse in={isOpen} animateOpacity>
          <VStack pl={6} align="start">
            {link.children!.map((child) => (
              <SidebarLinkItem key={child.name} link={child} />
            ))}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

export const SidebarContent = ({
  onClose,
  colorModes,
  linkItems,
  ...rest
}: SidebarProps) => {
  // const LogoComponent = logoService.getSvg('3:2', 'light');
  // const LogoComponent = Svg11.light;
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue(colorModes.light, colorModes.dark)}
      borderRight="1px"
      borderRightColor={useColorModeValue(colorModes.dark, colorModes.light)}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="center">
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <AspectRatio ratio={3 / 2} width="80px">
            <Box>{/* <LogoComponent width={128} height={80} /> */}</Box>
          </AspectRatio>
        </Box>
        {/* <Heading ml={3} fontSize="2xl">BH Hunter</Heading> */}
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      <VStack align="start" spacing={0}>
        {linkItems.map((link) => (
          <SidebarLinkItem key={link.name} link={link} />
        ))}
      </VStack>
    </Box>
  );
};

export const NavItem = ({
  icon,
  colorModes,
  children,
  ...rest
}: NavItemProps) => {
  const [isDark, setIsDark] = useState(false);
  const { colorMode } = useColorMode();

  React.useEffect(() => {
    setIsDark(colorMode === 'light');
  }, [colorMode]);

  return (
    <Box
      as="a"
      href="#"
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: useColorModeValue(colorModes?.dark, colorModes?.light),
          color: useColorModeValue(colorModes?.light, colorModes?.dark),
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: isDark ? colorModes?.light : colorModes?.dark,
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Box>
  );
};

export const MobileNav = ({
  onOpen,
  data,
  colorModes,
  ...rest
}: MobileProps) => {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);

  const { colorMode, toggleColorMode } = useColorMode();
  const {
    isOpen: isOpenDialog,
    onClose: onCloseDialog,
    onOpen: onOpenDialog,
  } = useDisclosure();

  const handleLogout = async () => {
    try {
      // If you want a fake delay to show loading:
      dispatch({ type: 'auth/loginStart' }); // sets status="loading"

      await new Promise((resolve) => setTimeout(resolve, 1500));

      dispatch(logout()); // clears token + resets state

      window.location.href = '/auth/login';
    } catch (err: any) {
      dispatch({ type: 'auth/loginFailure', payload: err.message });
    }
  };

  return (
    <AsyncState
      isLoading={authStatus === 'loading'}
      isError={authStatus === 'failed'}
      errorObject={authError}
      errorBody={(err) => (
        <Box>
          ❌ Logout failed
          <pre>{JSON.stringify(err, null, 2)}</pre>
        </Box>
      )}
    >
      <Flex
        ml={{ base: 0, md: 60 }}
        px={{ base: 4, md: 4 }}
        height="20"
        alignItems="center"
        bg={useColorModeValue(colorModes.light, colorModes.dark)} //* nav bar
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue(colorModes.dark, colorModes.light)}
        justifyContent={{ base: 'space-between', md: 'flex-end' }}
        {...rest}
      >
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<FiMenu />}
        />

        <Text
          display={{ base: 'flex', md: 'none' }}
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {data.logo}
        </Text>

        <HStack spacing={{ base: '0', md: '6' }}>
          <IconButton
            size="lg"
            variant="ghost"
            aria-label="open menu"
            icon={<FiBell />}
          />
          <IconButton
            size="lg"
            variant="ghost"
            aria-label="open menu"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
          />
          <Flex alignItems={'center'}>
            <Menu>
              <MenuButton
                py={2}
                transition="all 0.3s"
                _focus={{ boxShadow: 'none' }}
              >
                <HStack>
                  <Avatar size={'sm'} src={data.pfp} />
                  <VStack
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="flex-start"
                    spacing="1px"
                    ml="2"
                  >
                    <Text fontSize="sm">{data.name}</Text>
                    <Text
                      fontSize="xs"
                      color={useColorModeValue(
                        colorModes.dark,
                        colorModes.light,
                      )}
                    >
                      {data.role}
                    </Text>
                  </VStack>
                  <Box display={{ base: 'none', md: 'flex' }}>
                    <FiChevronDown />
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList>
                {data.optionsArray &&
                  data.optionsArray.map((option) => (
                    <MenuItem key={option.link}>{option.name}</MenuItem>
                  ))}
                <MenuDivider />
                <MenuItem onClick={onOpenDialog}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </HStack>
        <DialogWrapper
          isOpen={isOpenDialog}
          onClose={onCloseDialog}
          closeOnOverlayClick={false}
          closeOnEsc={false}
          header="Logout"
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '60vh' },
            overflowY: 'auto',
          }}
          footer={
            <Flex justify={'space-between'} width={'100%'}>
              <Button onClick={onCloseDialog}>Cancel</Button>
              <Button onClick={handleLogout}>Logout</Button>
            </Flex>
          }
        >
          <div style={{ padding: '1rem' }}>
            Are you sure you want to Logout?
          </div>
        </DialogWrapper>
      </Flex>
    </AsyncState>
  );
};
