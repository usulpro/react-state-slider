# React State Slider

Responsive slider smoothly switchable between states. It's controllable by mouse and touch screen

Demo https://usulpro.github.io/slider/

[![slider](https://github.com/UsulPro/react-state-slider/raw/master/doc/slider.jpg)](https://github.com/UsulPro/react-state-slider/raw/master/doc/slider.jpg)

## Usage

```sh
npm i react-state-slider --save
```

```js
import Slider, { createPoint } from 'react-state-slider';
// createPoint is an auxiliary tool for creating states array. It's up to you whether to use it


// somewhere in your app:

render() {
  return (
    <Slider />
  )
}
```

## API

React State Slider is highly customizable by passing `props` to the component.

### Prop types

```js
const propTypes = {
  snapMagnet: PropTypes.number, // snaping distance arount state point
  speed: PropTypes.number, // speed of the thumb when you clicking on the track
  frontZone: PropTypes.number, // The distance within which the thumb affects the state points (in %%)
  rearZone: PropTypes.number, // frontZone - when moving toward to points, rearZone - backward of points
  points: PropTypes.arrayOf(
    // array of states
    PropTypes.shape({
      snap: PropTypes.number, // distance to the point in %%
      renderTop: PropTypes.func, // function that render a top state component (see details below)
      renderBottom: PropTypes.func, // function that render a bottom state component (see details below)
    })
  ),
  initPos: PropTypes.number, // the index of initial state (from 0)
  onChange: PropTypes.func, // invokes when the thumb appears in new state (see details below)
  onDrag: PropTypes.func, // invokes when thumb is dragging
  classNames: PropTypes.shape(), // classNames of slider root, track, active track and thumb
  styles: PropTypes.shape(), // classNames for slider root, track, active track and thumb
  debug: PropTypes.bool, // will show additional information for each state point
};
```

### Default props

```js
const defaultProps = {
  snapMagnet: 30,
  speed: 1.5,
  frontZone: 10,
  rearZone: 10,
  points: new Array(9)
    .fill(0)
    .map((v, ind, arr) => createPoint({ ind, total: arr.length })),
  initPos: 4,
  onChange: () => {},
  onDrag: () => {},
  classNames: {
    slider: 'react-state-slider',
    track: 'track',
    activeTrack: 'active-track',
    thumb: 'thumb',
  },
  styles: {
    slider: {},
    track: {},
    activeTrack: {},
    thumb: {},
  },
  debug: false,
};
```

### renderTop (renderBottom)

```js
renderTop = (nFactor, trackWidth) => <TopComponent />;
```

where `nFactor` (`0 < nFactor < 1`)
is a coefficient that shows the distance between the thumb and this point. It's `0` when distance > `frontZone` (`rearZone`) and `1` when the thumb is exactly on the point.

`trackWidth` - is a current widh of the track. **Note** renderTop (renderBottom) will invoke when you resizing a browser window, so you can responsively control how your component appearance depending on screen resolution.

### onChange

```js
onChange({
  trackWidth, // width of a track element
  ...this.state, // state of the component
  ind, // the index of a current state
});
```

where state is:

```js
{
  valuePC, // distance of the thumb in %%
  valuePX, // distance of the thumb in pixels
  valueTr, // distance of the nearest state point in pixels
}
```

### createPoint

To create your custom states you need to pass them to the `points` prop of this Slider. You can do it manually, but in some cases it's more productive to use `createPoint` for that. It will calculate the %% for each point depending on the amount of them. You can do it the follow way:

```js
import Slider, { createPoint } from 'react-state-slider';

const statesAmount = 9;
const topFn = (nFactor, trackWidth) => { /* return Top Component */}
const bottomFn = (nFactor, trackWidth) => { /* return Bottom Component */}

<Slider
  points={new Array(statesAmount).fill(0).map((v, ind, arr) =>
    createPoint({
      ind,
      total: arr.length,
      top: topFn,
      bottom: bottomFn,
    })
  )}
/>

```

## Credits

If you use this component could you kindly consider to [star](https://github.com/UsulPro/react-state-slider/stargazers) this project

Created with ❤︎ to OSS by [@UsulPro](https://twitter.com/UsulPro)

any contributions are highly welcome!

MIT
