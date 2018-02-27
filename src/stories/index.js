import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs/react';

import Slider from '../';

storiesOf('Slider', module)
  .addDecorator(withKnobs)
  .add('Scroll', () => (
  <div>
    <Slider
      snapMagnet={number('snapMagnet', 30)}
      speed={number('speed', 0.75)}
      frontZone={number('frontZone', 10)}
      rearZone={number('rearZone', 10)}
    />
  </div>
));
