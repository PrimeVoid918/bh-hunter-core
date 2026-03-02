import { Button } from '@chakra-ui/react';

export const ApproveButton = ({ id }: { id: number }) => {
  console.log('Permit id: ', id);
  return <Button colorScheme="green">Approve</Button>;
};

export const RejectuButton = ({ id }: { id: number }) => {
  return <Button colorScheme="red">Reject</Button>;
};
