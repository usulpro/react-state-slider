import React from 'react';
import PropTypes from 'prop-types';
import { relative } from 'path';

const defaultTop = (nFactor, trackWidth) => {
  /**
   * 0 <= nFactor <= 1
   * 1: Thumb is exactly on this point
   * 0: Thumb is out of front (rear) zone
   *
   * trackWidth - width of the slider track
   *
   */
  return (
    <div
      style={{
        height: 16,
        width: 16,
        borderRadius: 20,
        backgroundColor: '#a1a1a1',
        position: 'relative',
        left: -8,
        bottom: nFactor * 30 + 10,
      }}
    />
  );
};

const defaultBottom = (nFactor, trackWidth) => {
  return trackWidth > 860 ? (
    <div
      style={{
        ...textStyle,
        position: 'relative',
        bottom: -20,
        left: -40,
        opacity: nFactor * 0.4 + 0.6,
      }}
    >
      Готовлюсь к мелкосерийному производству
    </div>
  ) : null;
};

const createPoint = ({
  ind,
  total = 9,
  top = defaultTop ,
  bottom = defaultBottom ,
}) => {
  return {
    snap: ind * 100 / (total - 1),
    renderTop: top,
    renderBottom: bottom,
  };
};

export { createPoint };

const propTypes = {
  snapMagnet: PropTypes.number,
  speed: PropTypes.number,
  frontZone: PropTypes.number,
  rearZone: PropTypes.number,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      snap: PropTypes.number,
      renderTop: PropTypes.func,
      renderBottom: PropTypes.func,
    })
  ),
  initPos: PropTypes.number,
  debug: PropTypes.bool,
};

const defaultProps = {
  snapMagnet: 30,
  speed: 1.5,
  frontZone: 10,
  rearZone: 10,
  points: new Array(9)
    .fill(0)
    .map((v, ind, arr) => createPoint({ ind, total: arr.length })),
  initPos: 4,
  debug: false,
};

const textStyle = {
  boxSizing: 'border-box',
  color: 'rgb(50, 48, 61)',
  cursor: 'pointer',
  display: 'block',
  fontFamily: 'Helveticaneue, sans-serif',
  fontSize: 12,
  fontWeight: 400,
  height: 28,
  // lineHeight: 14,
  marginTop: 7,
  width: 80,
  textAlign: 'center',
  textSizeAdjust: '100%',
};

const textActiveStyle = {
  color: 'rgb(108, 120, 144)',
};

export default class Slider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      valuePC: props.points[props.initPos].snap, // %%
      valuePX: 0, // pixels
      valueTr: 0, // pixels
    };

    this.settings = {
      trackHeight: 6,
      thumbRadius: 30,
      color: '#a9d601',
      trackColor: 'rgba(108, 120, 144, .1)',
      // snap: [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100],
      snap: props.points.map(point => point.snap),

      // snapMagnet: 10,
      // speed: 0.5,
      // frontZone: 100,
      // rearZone: 100,
      // ...props,
    };

    this.trackStyle = {
      width: '100%',
      height: this.settings.trackHeight,
      backgroundColor: this.settings.trackColor,
      overflow: 'visible',
      cursor: 'pointer',
      position: 'relative',
      top: 0,
    };

    this.trackActiveStyle = {
      width: 0,
      height: '100%',
      backgroundColor: this.settings.color,
      cursor: 'pointer',
      position: 'relative',
      top: 0,
      left: 0,
    };

    this.thumbPointStyle = {
      width: 0,
      height: 0,
      overflow: 'visible',
      position: 'relative',
    };

    this.thumbStyle = {
      position: 'relative',
      height: this.settings.thumbRadius,
      width: this.settings.thumbRadius,
      left: -this.settings.thumbRadius / 2,
      bottom: this.settings.thumbRadius / 2 - this.settings.trackHeight / 2,
      borderRadius: this.settings.thumbRadius,
      backgroundColor: this.settings.color,
      cursor: 'pointer',
      zIndex: 100,
      // opacity: 0.5,
    };

    this.thumbTransition = this.calcThumbTransition(100);

    this.thumbPoint = null;
    this.thumbVision = null;
    this.track = null;
    this.startPX = null;
    this.trackWidth = null;
    this.snapPX = [];
    this.transition = false;
    this.direction = 1;
    this.followID = null;
    this.followPX = null;
    this.wasClick = false;
    this.frontZonePX = null;
    this.rearZonePX = null;
  }

  trim = (val, min, max) => {
    const vmin = Math.max(val, min);
    return Math.min(vmin, max);
  };

  recalc = pc => {
    return this.trim(pc * this.trackWidth / 100, 0, this.trackWidth);
  };

  snap = px => {
    const snapPoints = this.snapPX.filter(
      val => Math.abs(val - px) <= this.props.snapMagnet
    );
    return snapPoints.length ? snapPoints[0] : px;
  };

  absSnap = px => {
    const dist = this.snapPX
      .map(val => Math.abs(val - px))
      .reduce((min, val, ind) => (val < min.val ? { ind, val } : min), {
        ind: -1,
        val: Infinity,
      });
    return this.snapPX[dist.ind];
  };

  calcLeft = (px, snap = this.snap) => {
    const leftPX = snap(this.trim(px, 0, this.trackWidth));
    return { valuePC: leftPX * 100 / this.trackWidth, valuePX: leftPX };
  };

  onResize = (
    frontZone = this.props.frontZone,
    rearZonePX = this.props.rearZone
  ) => {
    const { left, right } = this.track.getBoundingClientRect();
    this.trackWidth = right - left;
    this.snapPX = this.settings.snap.map(val => val * this.trackWidth / 100);
    this.frontZonePX = this.props.frontZone * this.trackWidth / 100;
    this.rearZonePX = this.props.rearZone * this.trackWidth / 100;

    this.setState({
      valuePX: this.recalc(this.state.valuePC),
    });
  };

  onMouseMove = event => {
    if (event.buttons !== 1) {
      this.onMouseUp();
    }
    const x = event.clientX - this.startPX;
    const val = this.calcLeft(x);

    this.direction =
      Math.sign(val.valuePX - this.state.valuePX) || this.direction;
    this.setState({ ...val });

    // console.log(this.direction, val);
  };

  onMouseUp = event => {
    event.stopPropagation();
    event.preventDefault();

    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.finishDrag(event.clientX);
  };

  onMouseDown = event => {
    event.stopPropagation();
    event.preventDefault();

    // const currentPX = this.thumbPoint.getBoundingClientRect().left;
    this.startPX = event.clientX - this.state.valuePX;
    this.transition = false;

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    // console.log('mouseDown. startPX: ', this.startPX)
  };

  onTouchStart = event => {
    event.stopPropagation();
    event.preventDefault();

    this.startPX = event.touches[0].screenX - this.state.valuePX;
    this.transition = false;

    this.thumbVision.addEventListener('touchmove', this.onTouchMove);
    this.thumbVision.addEventListener('touchend', this.onTouchEnd);

    // console.log('tStart', event.touches[0].screenX);
  };

  onTouchMove = event => {
    event.stopPropagation();
    event.preventDefault();

    const x = event.touches[0].screenX - this.startPX;
    const val = this.calcLeft(x);

    this.direction =
      Math.sign(val.valuePX - this.state.valuePX) || this.direction;
    this.setState({ ...val });

    // console.log('tMove', event.touches[0].screenX);
  };

  onTouchEnd = event => {
    this.thumbVision.removeEventListener('touchmove', this.onTouchMove);
    this.thumbVision.removeEventListener('touchend', this.onTouchEnd);

    // console.log('tEnd', event);
    this.finishDrag(event.changedTouches[0].clientX);
  };

  finishDrag = (x) => {
    // console.log('finishDrag', x);
    this.trackClick({clientX: x})
  }


  followTrans = () => {
    this.followID = setInterval(() => {
      // console.log('following')
      if (!this.thumbPoint || !this.track) return;
      const px =
        this.thumbPoint.getBoundingClientRect().left -
        this.track.getBoundingClientRect().left;
      this.direction = Math.sign(px - this.followPX) || this.direction;
      this.followPX = px;
      if (Math.abs(px - this.state.valuePX) < 0.1 || !this.wasClick) {
        clearInterval(this.followID);
        this.followID = null;
        this.wasClick = false;
      }
      this.setState({
        valueTr: this.followPX,
      });
    }, 10);
  };

  trackClick = event => {
    // console.log('>> Click <<');
    if (this.wasClick) return;
    this.wasClick = true;
    const x = event.clientX - this.track.getBoundingClientRect().left;
    const val = this.calcLeft(x, this.absSnap);
    this.transition = true;
    this.thumbTransition = this.calcThumbTransition(
      Math.abs(val.valuePX - this.state.valuePX)
    );
    this.followTrans();
    // console.log(x, val);
    this.setState({ ...val });
  };

  calcThumbTransition = dist => {
    const tm = dist / this.props.speed;
    return { left: `left ${tm}ms ease-out`, width: `width ${tm}ms ease-out` };
  };

  componentDidMount() {
    this.thumbVision.addEventListener('mousedown', this.onMouseDown);
    this.thumbVision.addEventListener('touchstart', this.onTouchStart);


    window.addEventListener('resize', this.onResize);

    this.setState({
      // valuePC: this.calcLeft(50).valuePC, // %%
      // valuePC: 50, // %%
    });
    this.onResize();
  }

  componentWillUnmount() {
    this.thumbVision.removeEventListener('mousedown', this.onMouseDown);
    this.thumbVision.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
  }

  componentWillReceiveProps({ frontZone, rearZonePX }) {
    this.onResize(frontZone, rearZonePX);
  }

  calcPointHeight = (pointPos, valPX, direction) => {
    if (pointPos === valPX) return 1;
    if (direction === null) return 0;
    const dist = (pointPos - valPX) * direction;
    if (dist > 0 && dist < this.frontZonePX) {
      return 1 - dist / this.frontZonePX;
    }
    if (dist < 0 && dist > -this.rearZonePX) {
      return 1 + dist / this.rearZonePX;
    }
    if (dist === 0) return 1;
    return 0;
  };

  renderPoint = (point, valPX) => {
    const posPX = this.recalc(point.snap);
    const nFactor = this.calcPointHeight(posPX, valPX, this.direction);

    return (
      <div name="snap-point"
        key={point.snap}
        style={{
          position: 'absolute',
          top: 0,
          left: posPX,
          height: 20,
          width: 0,
          overflow: 'visible',
        }}
      >
        {point.renderTop(nFactor, this.trackWidth)}
        {point.renderBottom(nFactor, this.trackWidth)}
        {this.props.debug && (
          <div
            style={{ width: 100, fontSize: 12, top: 200, position: 'relative' }}
          >
            {`nFactor: ${Math.round(nFactor * 100) / 100},`} <br />
            {`front: ${this.frontZonePX},`}
            <br />
            {`rear: ${this.rearZonePX}`}
            <br />
            {`direction: ${this.direction}`}
            <br />
            {`followID: ${this.followID}`}
            <br />
          </div>
        )}
      </div>
    );
  };

  render() {
    const leftFactor = this.followID ? this.state.valueTr : this.state.valuePX;
    return (
      <div
        name="slider"
        style={{
          with: 600,
          height: 130,
          paddingTop: 30,
          backgroundColor: 'rgba(0,0,0,0)',
          cursor: 'pointer',
        }}
        onClick={this.trackClick}
        onTouchStart={ev => ev.stopPropagation()}
      >
        <div
          name="track"
          ref={ref => {
            this.track = ref;
          }}
          // onClick={this.trackClick}
          style={this.trackStyle}
        >
          <div
            name="thumb-point"
            ref={ref => {
              this.thumbPoint = ref;
            }}
            style={{
              ...this.thumbPointStyle,
              transition: this.transition ? this.thumbTransition.left : '',
              left: `${this.state.valuePC}%`,
            }}
          >
            <div
              name="thumb-vision"
              ref={ref => {
                this.thumbVision = ref;
              }}
              style={this.thumbStyle}
            >
              <div
                name="thumb-area"
                ref={ref => {
                  this.thumbArea = ref;
                }}
                style={{
                  ...this.thumbStyle,
                  backgroundColor: 'rgba(0,0,0,0)',
                  width: 60,
                }}
              />
            </div>
          </div>
          <div
            name="track-active"
            style={{
              ...this.trackActiveStyle,
              transition: this.transition ? this.thumbTransition.width : '',
              width: `${this.state.valuePC}%`,
            }}
          />
        </div>
        <div name="snaps-holder"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            // top: 100,
          }}
        >
          {this.props.points.map(point =>
            this.renderPoint(point, leftFactor)
          )}
        </div>
      </div>
    );
  }
}

Slider.propTypes = propTypes;
Slider.defaultProps = defaultProps;

/* {this.renderPoint(0, leftFactor)}
          {this.renderPoint(12.5, leftFactor)}
          {this.renderPoint(25, leftFactor)}
          {this.renderPoint(37.5, leftFactor)}
          {this.renderPoint(50, leftFactor)}
          {this.renderPoint(62.5, leftFactor)}
          {this.renderPoint(75, leftFactor)}
          {this.renderPoint(87.5, leftFactor)}
          {this.renderPoint(100, leftFactor)} */
