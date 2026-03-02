import styled from '@emotion/styled';
import { Colors } from './themes/colors';

export const GlobalsContainer = styled.div`
  flex: 1; /* Usually flex: 1 means flex-grow:1, flex-shrink:1, flex-basis:0 */
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  background-color: ${Colors.PrimaryLight[8]};
`;

export const GlobalsContentContainer = styled.div`
  display: flex; /* need display flex for justifyContent and alignItems */
  justify-content: flex-start;
  align-items: stretch;
`;

export const FontColor = styled.div`
  color: ${Colors.Text[2]};
`;

export const HeadingsFont = styled.div`
  font-family: 'Baloo2', sans-serif;
`;

export const BodyFont = styled.div`
  font-family: 'QuickSand', sans-serif;
`;

export const AlternativeFont = styled.div`
  font-family: 'Fredoka', sans-serif;
`;

export const GenericFont = styled.div`
  font-family: 'Segoe UI', sans-serif;
`;
