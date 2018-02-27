import React from 'react';
import PropTypes from 'prop-types';
import { relative } from 'path';

const propTypes = {
  snapMagnet: PropTypes.number,
  speed: PropTypes.number,
  frontZone: PropTypes.number,
  rearZone: PropTypes.number,
};

const defaultProps = {
  snapMagnet: 30,
  speed: 1.5,
  frontZone: 10,
  rearZone: 10,
};
export default class Slider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      valuePC: 50, // %%
      valuePX: 0, // pixels
      valueTr: 0, // pixels
    };

    this.settings = {
      trackHeight: 6,
      thumbRadius: 30,
      color: '#a9d601',
      trackColor: 'rgba(108, 120, 144, .1)',
      snap: [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100],
      // snapMagnet: 10,
      // speed: 0.5,
      // frontZone: 100,
      // rearZone: 100,
      ...props,
    };

    this.trackStyle = {
      width: '100%',
      height: this.settings.trackHeight,
      backgroundColor: this.settings.trackColor,
      overflow: 'visible',
      cursor: 'pointer',
      position: 'relative',
      top: 100,
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

    this.textStyle = {
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


    this.textActiveStyle = {
      color: 'rgb(108, 120, 144)',
    };

    this.thumbTransition = this.calcThumbTransition(100);

    this.thumbPoint = null;
    this.thumbVision = null;
    this.track = null;
    this.startPX = null;
    this.trackWidth = null;
    this.snapPX = [];
    this.transition = false;
    this.direction = null;
    this.followID = null;
    this.followPX = null;
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

  onResize = () => {
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

    // console.log(this.direction, val.valuePX);
  };

  onMouseUp = event => {
    event.stopPropagation();
    event.preventDefault();
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  };

  onMouseDown = event => {
    event.stopPropagation();
    event.preventDefault();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    const currentPX = this.thumbPoint.getBoundingClientRect().left;
    this.startPX = event.clientX - this.state.valuePX;
    this.transition = false;
  };

  onTouchStart = event => {
    event.preventDefault();
    console.log(event);
  };

  followTrans = () => {
    this.followID = setInterval(() => {
      if (!this.thumbPoint || !this.track) return;
      console.log('following')
      const px =
        this.thumbPoint.getBoundingClientRect().left -
        this.track.getBoundingClientRect().left;
      this.direction = Math.sign(px - this.followPX) || this.direction;
      this.followPX = px;
      if (Math.abs(px - this.state.valuePX) < 0.1) {
        clearInterval(this.followID);
        this.followID = null;
      }
      this.setState({
        valueTr: this.followPX,
      });
    }, 10);
  };

  trackClick = event => {
    const x = event.clientX - this.track.getBoundingClientRect().left;
    const val = this.calcLeft(x, this.absSnap);
    this.transition = true;
    this.thumbTransition = this.calcThumbTransition(
      Math.abs(val.valuePX - this.state.valuePX)
    );
    this.followTrans();
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
      valuePC: 50, // %%
    });
    this.onResize();
  }

  componentWillUnmount() {
    this.thumbPoint.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
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

  renderPoint = (posPC, valPX) => {
    const posPX = this.recalc(posPC);
    const btm = this.calcPointHeight(posPX, valPX, this.direction);
    const textStyle = this.textStyle;
    if (btm > 0.8) {
      // textStyle.color = this.textActiveStyle.color;
      console.log(posPC, btm)
    };
    return (
      <div
        style={{
          // position: 'absolute',
          // left: pos,
          height: 20,
          width: 0,
          overflow: 'visible',
        }}
      >
        <div
          style={{
            height: 16,
            width: 16,
            borderRadius: 20,
            backgroundColor: '#a1a1a1',
            position: 'relative',
            left: -8,
            bottom: btm * 30 + 10,
          }}
        />
        {this.trackWidth > 860 ? <div
          style={{
            ...textStyle,
            position: 'relative',
            bottom: -20,
            left: -40,
            opacity: btm * 0.4 + 0.6,
          }}
        >
          Готовлюсь к мелкосерийному производству
        </div> : null}
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
          height: 150,
          padding: 50,
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
          onClick={this.trackClick}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            top: 100,
          }}
        >
          {this.renderPoint(0, leftFactor)}
          {this.renderPoint(12.5, leftFactor)}
          {this.renderPoint(25, leftFactor)}
          {this.renderPoint(37.5, leftFactor)}
          {this.renderPoint(50, leftFactor)}
          {this.renderPoint(62.5, leftFactor)}
          {this.renderPoint(75, leftFactor)}
          {this.renderPoint(87.5, leftFactor)}
          {this.renderPoint(100, leftFactor)}
        </div>
      </div>
    );
  }
}

Slider.propTypes = propTypes;
Slider.defaultProps = defaultProps;
