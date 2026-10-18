import React from 'react';
import { render } from '@testing-library/react-native';
import EditScreenInfo from './EditScreenInfo';

test('renders correctly', () => {
  const { getByText } = render(<EditScreenInfo />);
  expect(getByText('Edit your screen info here!')).toBeTruthy();
});