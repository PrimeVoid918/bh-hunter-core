import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Box, BoxProps, Text, Collapse, CollapseProps } from '@chakra-ui/react';

/**
 * Props for the `SidebarItem` component.
 */
interface SidebarItemProps {
  /** The main label text displayed for this sidebar item. */
  label: string;

  /** Optional nested content (e.g., sub-items) that will render inside a collapsible section. */
  children?: React.ReactNode;

  /** Width of the container box. Accepts any valid CSS width value, e.g., '250px', '100%', '50vw'. */
  containerWidth?: React.CSSProperties['width'];

  /** Cursor style for the text container. Defaults to 'pointer' if not provided. */
  cursor?: React.CSSProperties['cursor'];

  /** Background color applied on hover for the text container. Defaults to 'gray.200'. */
  bgColorOnHover?: React.CSSProperties['backgroundColor'];

  /** Optional inline style for the text container. */
  textContainerStyle?: React.CSSProperties;

  /** Additional Chakra UI props to apply to the outer container Box. */
  chackraContainerBoxProps?: BoxProps;

  /** Additional Chakra UI props to apply to the text container Box. */
  chackraTextContainerBoxProps?: BoxProps;

  /** Additional Chakra UI props to apply to the Collapse component. */
  chackraCollapseProps?: CollapseProps;
}

/**
 * A reusable sidebar item component with optional collapsible children.
 *
 * @example
 * <SidebarItem
 *   label="Dashboard"
 *   containerWidth="250px"
 *   bgColorOnHover="blue.50"
 *   chackraTextContainerBoxProps={{ p: 3, borderRadius: 'md' }}
 * >
 *   <Text>Sub-item 1</Text>
 *   <Text>Sub-item 2</Text>
 * </SidebarItem>
 *
 * @param {SidebarItemProps} props - Props to customize the sidebar item.
 * @returns {JSX.Element} A sidebar item with optional collapsible children.
 */
export function SidebarItem({
  label,
  children,
  containerWidth = '100%',
  cursor,
  bgColorOnHover = 'gray.200',
  textContainerStyle,
  chackraContainerBoxProps,
  chackraTextContainerBoxProps,
  chackraCollapseProps,
}: SidebarItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Box w={containerWidth} {...chackraContainerBoxProps}>
      <Box
        cursor={cursor || 'pointer'}
        onClick={() => setOpen(!open)}
        style={textContainerStyle}
        _hover={{ bg: bgColorOnHover }}
        {...chackraTextContainerBoxProps}
      >
        <Text className="sidebar-label">{label}</Text>
        {children && (open ? <ChevronUpIcon /> : <ChevronDownIcon />)}
      </Box>
      {children && (
        <Collapse
          in={open}
          animateOpacity
          className="sidebar-collapse"
          {...chackraCollapseProps}
        >
          {children}
        </Collapse>
      )}
    </Box>
  );
}
