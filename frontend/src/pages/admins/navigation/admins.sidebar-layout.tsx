import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { LinkItemProps, MobileNav, SidebarContent } from './compo';
import { FiHome } from 'react-icons/fi';
import { GrValidate, GrCatalogOption } from 'react-icons/gr';
import { Colors } from '@/pages/constants';
import BaseWrapper from '@/pages/shared/layouts/wrappers/base-wrapper';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/stores';

export default function Sidebar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.firstname ?? '';
  const lastName = user?.lastname ?? '';
  const userRole = user?.role ?? '';
  const { isOpen, onOpen, onClose } = useDisclosure();

  const userData = {
    name: `${firstName} ${lastName}`,
    logo: 'Logo',
    pfp: 'https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    role: userRole,
    optionsArray: [
      {
        name: 'Profile',
        link: '/admin',
      },
      {
        name: 'Settings',
        link: '/admin/settings',
      },
    ],
  };

  const colorModes = {
    light: Colors.PrimaryLight[2],
    dark: Colors.PrimaryLight[10],
  };

  const LinkItems: Array<LinkItemProps> = [
    { name: 'Dashboard', icon: FiHome, link: '/admin', colorModes: colorModes }, // no children
    {
      name: 'Validation',
      icon: GrValidate,
      // link: '/admin/validation',
      colorModes: colorModes,
      children: [
        {
          name: 'Owners',
          colorModes: colorModes,
          children: [
            { name: 'Permits', icon: FiHome, link: '/admin/validation/owners' },
          ],
        },
        {
          name: 'Tenants',
          // link: '/admin/validation/tenants',
          colorModes: colorModes,
          children: [
            {
              name: 'Valid ID',
              icon: FiHome,
              link: '/admin/validation/tenants',
            },
          ],
        },
      ],
    },
    {
      name: 'Users',
      icon: GrValidate,
      colorModes: colorModes,
      children: [
        {
          name: 'Owners',
          colorModes: colorModes,
          link: '/admin/users/owners',
        },
        {
          name: 'Tenants',
          colorModes: colorModes,
          link: '/admin/users/tenants',
        },
      ],
    },
    {
      name: 'Logs',
      icon: GrCatalogOption,
      link: '/admin/logs',
      colorModes: colorModes,
    }, // no children
  ];

  return (
    <Box minH="100vh" bg={useColorModeValue(colorModes.light, colorModes.dark)}>
      <SidebarContent
        colorModes={colorModes}
        linkItems={LinkItems}
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent
            colorModes={colorModes}
            linkItems={LinkItems}
            onClose={onClose}
          />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <Flex direction="column" ml={{ base: 0, md: 60 }}>
        <MobileNav onOpen={onOpen} data={userData} colorModes={colorModes} />
        <Box flex="1" p="4" overflowY="auto">
          <BaseWrapper>
            <Outlet />
          </BaseWrapper>
        </Box>
      </Flex>
    </Box>
  );
}
